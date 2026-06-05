"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getInternationalAge } from "@/lib/auth/age";
import {
  clearSession,
  ensureOperatorAccount,
  findUserByGmail,
  findUserByPersonalCode,
  findUserByPhone,
  findUserByNickname,
  generatePersonalCode,
  getSessionUser,
  saveUser,
  setSessionUserId,
  updateUser,
  setMemberSyncHandler,
} from "@/lib/auth/storage";
import { formatPhone, maskEmail, normalizePhone } from "@/lib/auth/phone";
import {
  persistUiLocale,
  persistUiLocaleOnLogout,
  syncUiLocaleForUser,
} from "@/lib/i18n/locale";
import {
  MODERATION_CHANGE_EVENT,
  isLoginBlocked,
  purgeExpiredRestrictions,
} from "@/lib/auth/moderation";
import { extendPremiumUntil } from "@/lib/auth/premium";
import type { AuthFail } from "@/lib/auth/errors";
import { authFail } from "@/lib/auth/errors";
import { validateGmail } from "@/lib/auth/gmail";
import type { GoogleSignupInput, LoginInput, SignupInput, User } from "@/lib/auth/types";
import type { VerificationMethod } from "@/lib/auth/verification";
import { refreshSupabaseSessionWithRetry } from "@/lib/auth/refreshSessionWithRetry";
import {
  GOOGLE_AUTH_ENABLED,
  SIGNUP_PROFILE_PHOTO_REQUIRED,
  SIGNUP_REFERRAL_CODE_ENABLED,
} from "@/lib/auth/features";
import { saveGoogleProfile } from "@/lib/auth/supabaseUser";
import { MEMBERS_SYNC_EVENT, scheduleMemberSync } from "@/lib/auth/memberSync";
import { markSignupWelcomePending } from "@/lib/auth/signupWelcome";
import {
  getPreferredLocalSessionUser,
  shouldIgnoreSupabaseSessionSync,
} from "@/lib/auth/sessionPreference";
import { isSameSessionUser } from "@/lib/auth/sessionUser";
import { tryCreateClient } from "@/utils/supabase/client";

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  signup: (input: SignupInput) => { ok: true } | AuthFail;
  completeGoogleSignup: (input: GoogleSignupInput) => Promise<{ ok: true } | AuthFail>;
  login: (input: LoginInput) => { ok: true } | AuthFail;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  applyReferralCode: (code: string) => { ok: true } | AuthFail;
  findAccountId: (
    method: VerificationMethod,
    contact: string
  ) => { ok: true; email: string } | AuthFail;
  resetPassword: (
    method: VerificationMethod,
    contact: string,
    newPassword: string
  ) => { ok: true } | AuthFail;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => { ok: true } | AuthFail;
  changePhone: (newPhone: string) => { ok: true } | AuthFail;
  updateBasicProfile: (input: {
    name: string;
    nickname: string;
    gender: "male" | "female";
    birthDate: string;
    hometown: string;
    koreanPhone: string;
  }) => { ok: true } | AuthFail;
  updateProfileImage: (profileImage: string) => { ok: true } | AuthFail;
  subscribePremium: () => { ok: true } | AuthFail;
  activatePremiumAfterPayment: (premiumUntil: string) => { ok: true } | AuthFail;
  getVerificationTarget: (
    method: VerificationMethod,
    contact: string
  ) => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function createUniqueCode(): string {
  let code = generatePersonalCode();
  while (findUserByPersonalCode(code)) {
    code = generatePersonalCode();
  }
  return code;
}

function applySessionUser(
  setUser: Dispatch<SetStateAction<User | null>>,
  nextUser: User | null
) {
  setUser((previous) => {
    if (isSameSessionUser(previous, nextUser)) {
      return previous;
    }
    syncUiLocaleForUser(nextUser);
    return nextUser;
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setMemberSyncHandler((member) => {
      scheduleMemberSync(member);
    });
    return () => setMemberSyncHandler(null);
  }, []);

  useEffect(() => {
    ensureOperatorAccount();
    purgeExpiredRestrictions();

    async function initSession() {
      const localSessionUser = getPreferredLocalSessionUser();
      if (localSessionUser) {
        applySessionUser(setUser, localSessionUser);
        return;
      }

      if (GOOGLE_AUTH_ENABLED) {
        try {
          const supabaseResult = await refreshSupabaseSessionWithRetry();
          if (supabaseResult.user) {
            applySessionUser(setUser, supabaseResult.user);
            return;
          }
        } catch {
          // Fall back to local session when Supabase is unavailable.
        }
      }

      applySessionUser(setUser, getSessionUser());
    }

    void initSession().finally(() => {
      setIsReady(true);
    });

    const supabase = GOOGLE_AUTH_ENABLED ? tryCreateClient() : null;
    const subscription = supabase
      ? supabase.auth.onAuthStateChange(() => {
          if (shouldIgnoreSupabaseSessionSync()) {
            const localUser = getPreferredLocalSessionUser();
            if (localUser) {
              applySessionUser(setUser, localUser);
            }
            return;
          }

          void refreshSupabaseSessionWithRetry().then((result) => {
            purgeExpiredRestrictions();
            if (result.user) {
              applySessionUser(setUser, result.user);
              return;
            }
            applySessionUser(setUser, getSessionUser());
          });
        }).data.subscription
      : null;

    const refreshSession = () => {
      purgeExpiredRestrictions();

      const localUser = getPreferredLocalSessionUser();
      if (localUser) {
        applySessionUser(setUser, localUser);
        return;
      }

      void refreshSupabaseSessionWithRetry().then((result) => {
        if (result.user) {
          applySessionUser(setUser, result.user);
          return;
        }
        applySessionUser(setUser, getSessionUser());
      });
    };

    const refreshLocalSession = () => {
      purgeExpiredRestrictions();
      applySessionUser(setUser, getSessionUser());
    };

    window.addEventListener(MODERATION_CHANGE_EVENT, refreshSession);
    window.addEventListener(MEMBERS_SYNC_EVENT, refreshLocalSession);
    window.addEventListener("focus", refreshSession);
    return () => {
      subscription?.unsubscribe();
      window.removeEventListener(MODERATION_CHANGE_EVENT, refreshSession);
      window.removeEventListener(MEMBERS_SYNC_EVENT, refreshLocalSession);
      window.removeEventListener("focus", refreshSession);
    };
  }, []);

  const signup = useCallback((input: SignupInput) => {
    const gmailResult = validateGmail(input.gmail);
    if (!gmailResult.ok) {
      return authFail("GMAIL_INVALID");
    }

    if (findUserByGmail(gmailResult.gmail)) {
      return authFail("EMAIL_TAKEN");
    }

    if (findUserByPhone(input.koreanPhone)) {
      return authFail("PHONE_TAKEN");
    }

    const nickname = input.nickname.trim();
    if (nickname.length < 2 || nickname.length > 16) {
      return authFail("NICKNAME_INVALID");
    }

    if (findUserByNickname(nickname)) {
      return authFail("NICKNAME_TAKEN");
    }

    if (SIGNUP_PROFILE_PHOTO_REQUIRED && !input.profileImage?.trim()) {
      return authFail("PROFILE_REQUIRED");
    }

    if (input.gender !== "male" && input.gender !== "female") {
      return authFail("GENDER_REQUIRED");
    }

    const age = getInternationalAge(input.birthDate);
    if (age < 18 || age > 100) {
      return authFail("AGE_INVALID");
    }

    if (SIGNUP_REFERRAL_CODE_ENABLED && input.referralCode?.trim()) {
      const referrer = findUserByPersonalCode(input.referralCode.trim());
      if (!referrer) {
        return authFail("REFERRAL_INVALID");
      }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      nickname,
      gender: input.gender,
      profileImage: input.profileImage?.trim() || undefined,
      birthDate: input.birthDate,
      hometown: input.hometown.trim(),
      gmail: gmailResult.gmail,
      koreanPhone: formatPhone(input.koreanPhone),
      personalCode: createUniqueCode(),
      referredBy:
        SIGNUP_REFERRAL_CODE_ENABLED && input.referralCode?.trim()
          ? input.referralCode.trim().toUpperCase()
          : undefined,
      password: input.password,
      role: "user",
      preferredLocale: input.isKoreanMember ? "ko" : "th",
      isKoreanMember: Boolean(input.isKoreanMember),
      points: 0,
      authProvider: "local",
      createdAt: new Date().toISOString(),
    };

    saveUser(newUser);
    setSessionUserId(newUser.id);
    setUser(newUser);
    markSignupWelcomePending(newUser.id);
    persistUiLocale(newUser.preferredLocale ?? "th");
    scheduleMemberSync(newUser, true);
    return { ok: true as const };
  }, []);

  const refreshSession = useCallback(async () => {
    if (GOOGLE_AUTH_ENABLED) {
      const result = await refreshSupabaseSessionWithRetry();
      if (result.user) {
        applySessionUser(setUser, result.user);
        return;
      }
    }
    applySessionUser(setUser, getSessionUser());
  }, []);

  const completeGoogleSignup = useCallback(async (input: GoogleSignupInput) => {
    const supabase = tryCreateClient();
    if (!supabase) {
      return authFail("PROFILE_SAVE_FAILED");
    }
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return authFail("LOGIN_REQUIRED");
    }

    const gmail = authUser.email.toLowerCase();
    const nickname = input.nickname.trim();

    if (nickname.length < 2 || nickname.length > 16) {
      return authFail("NICKNAME_INVALID");
    }

    if (findUserByNickname(nickname) && findUserByGmail(gmail)?.nickname !== nickname) {
      return authFail("NICKNAME_TAKEN");
    }

    if (SIGNUP_PROFILE_PHOTO_REQUIRED && !input.profileImage?.trim()) {
      return authFail("PROFILE_REQUIRED");
    }

    if (input.gender !== "male" && input.gender !== "female") {
      return authFail("GENDER_REQUIRED");
    }

    const age = getInternationalAge(input.birthDate);
    if (age < 18 || age > 100) {
      return authFail("AGE_INVALID");
    }

    if (SIGNUP_REFERRAL_CODE_ENABLED && input.referralCode?.trim()) {
      const referrer = findUserByPersonalCode(input.referralCode.trim());
      if (!referrer) {
        return authFail("REFERRAL_INVALID");
      }
    }

    const existing = findUserByGmail(gmail);
    const newUser: User = {
      id: authUser.id,
      name: input.name.trim(),
      nickname,
      gender: input.gender,
      profileImage: input.profileImage?.trim() || undefined,
      birthDate: input.birthDate,
      hometown: input.hometown.trim(),
      gmail,
      koreanPhone: formatPhone(input.koreanPhone),
      personalCode: existing?.personalCode ?? createUniqueCode(),
      referredBy:
        SIGNUP_REFERRAL_CODE_ENABLED && input.referralCode?.trim()
          ? input.referralCode.trim().toUpperCase()
          : existing?.referredBy,
      password: "",
      role: existing?.role ?? "user",
      preferredLocale:
        existing?.preferredLocale ??
        (input.isKoreanMember ? "ko" : "th"),
      isKoreanMember: input.isKoreanMember ?? existing?.isKoreanMember ?? false,
      points: existing?.points ?? 0,
      premiumUntil: existing?.premiumUntil,
      restriction: existing?.restriction,
      supabaseId: authUser.id,
      authProvider: "google",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    const saved = await saveGoogleProfile(newUser);
    if (!saved.ok) {
      return authFail("PROFILE_SAVE_FAILED");
    }

    setUser(newUser);
    markSignupWelcomePending(newUser.id);
    persistUiLocale(newUser.preferredLocale ?? "th");
    scheduleMemberSync(newUser, true);
    return { ok: true as const };
  }, []);

  const login = useCallback((input: LoginInput) => {
    const gmailResult = validateGmail(input.gmail);
    if (!gmailResult.ok) {
      return authFail("GMAIL_INVALID");
    }

    const found = findUserByGmail(gmailResult.gmail);
    if (!found || found.password !== input.password) {
      return authFail("LOGIN_FAILED");
    }
    if (isLoginBlocked(found)) {
      return authFail("ACCOUNT_BANNED");
    }

    void (async () => {
      try {
        const supabase = tryCreateClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch {
        // Ignore — local session takes over.
      }
    })();

    setSessionUserId(found.id);
    setUser(found);
    syncUiLocaleForUser(found);
    scheduleMemberSync(found, true);
    return { ok: true as const };
  }, []);

  const logout = useCallback(async () => {
    persistUiLocaleOnLogout(user);
    try {
      const supabase = tryCreateClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore network errors during sign-out.
    }
    clearSession();
    setUser(null);
  }, [user]);

  const applyReferralCode = useCallback(
    (code: string) => {
      if (!user) {
        return authFail("LOGIN_REQUIRED");
      }
      if (user.referredBy) {
        return authFail("REFERRAL_ALREADY");
      }
      const trimmed = code.trim().toUpperCase();
      if (trimmed === user.personalCode) {
        return authFail("REFERRAL_SELF");
      }
      const referrer = findUserByPersonalCode(trimmed);
      if (!referrer) {
        return authFail("REFERRAL_INVALID");
      }
      const updated: User = { ...user, referredBy: trimmed };
      updateUser(updated);
      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const findAccountId = useCallback(
    (method: VerificationMethod, contact: string) => {
      if (method === "email") {
        const gmailResult = validateGmail(contact);
        if (!gmailResult.ok) {
          return authFail("GMAIL_INVALID");
        }
        const found = findUserByGmail(gmailResult.gmail);
        if (!found) {
          return authFail("ACCOUNT_NOT_FOUND");
        }
        return { ok: true as const, email: maskEmail(found.gmail) };
      }

      const found = findUserByPhone(contact);
      if (!found) {
        return authFail("ACCOUNT_NOT_FOUND");
      }
      return { ok: true as const, email: maskEmail(found.gmail) };
    },
    []
  );

  const resetPassword = useCallback(
    (method: VerificationMethod, contact: string, newPassword: string) => {
      let found: User | undefined;
      if (method === "email") {
        const gmailResult = validateGmail(contact);
        if (!gmailResult.ok) {
          return authFail("GMAIL_INVALID");
        }
        found = findUserByGmail(gmailResult.gmail);
      } else {
        found = findUserByPhone(contact);
      }
      if (!found) {
        return authFail("ACCOUNT_NOT_FOUND");
      }
      if (newPassword.length < 6) {
        return authFail("PASSWORD_SHORT");
      }
      const updated: User = { ...found, password: newPassword };
      updateUser(updated);
      if (user?.id === found.id) {
        setUser(updated);
      }
      return { ok: true as const };
    },
    [user]
  );

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      if (!user) {
        return authFail("LOGIN_REQUIRED");
      }
      if (user.password !== currentPassword) {
        return authFail("PASSWORD_WRONG");
      }
      if (newPassword.length < 6) {
        return authFail("PASSWORD_SHORT");
      }
      const updated: User = { ...user, password: newPassword };
      updateUser(updated);
      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const changePhone = useCallback(
    (newPhone: string) => {
      if (!user) {
        return authFail("LOGIN_REQUIRED");
      }
      const formatted = formatPhone(newPhone);
      if (findUserByPhone(formatted) && normalizePhone(formatted) !== normalizePhone(user.koreanPhone)) {
        return authFail("PHONE_IN_USE");
      }
      const updated: User = { ...user, koreanPhone: formatted };
      updateUser(updated);
      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const updateBasicProfile = useCallback(
    (input: {
      name: string;
      nickname: string;
      gender: "male" | "female";
      birthDate: string;
      hometown: string;
      koreanPhone: string;
    }) => {
      if (!user) {
        return authFail("LOGIN_REQUIRED");
      }

      const nickname = input.nickname.trim();
      if (nickname.length < 2 || nickname.length > 16) {
        return authFail("NICKNAME_INVALID");
      }
      const sameNicknameOwner = findUserByNickname(nickname);
      if (sameNicknameOwner && sameNicknameOwner.id !== user.id) {
        return authFail("NICKNAME_TAKEN");
      }

      if (input.gender !== "male" && input.gender !== "female") {
        return authFail("GENDER_REQUIRED");
      }

      const age = getInternationalAge(input.birthDate);
      if (age < 18 || age > 100) {
        return authFail("AGE_INVALID");
      }

      const formattedPhone = formatPhone(input.koreanPhone);
      const samePhoneOwner = findUserByPhone(formattedPhone);
      if (
        samePhoneOwner &&
        normalizePhone(samePhoneOwner.koreanPhone) !== normalizePhone(user.koreanPhone)
      ) {
        return authFail("PHONE_IN_USE");
      }

      const updated: User = {
        ...user,
        name: input.name.trim(),
        nickname,
        gender: input.gender,
        birthDate: input.birthDate,
        hometown: input.hometown.trim(),
        koreanPhone: formattedPhone,
      };
      updateUser(updated);
      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const updateProfileImage = useCallback(
    (profileImage: string) => {
      if (!user) {
        return authFail("LOGIN_REQUIRED");
      }
      if (!profileImage.trim()) {
        return authFail("PROFILE_REQUIRED");
      }
      const updated: User = { ...user, profileImage };
      updateUser(updated);
      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const subscribePremium = useCallback(() => {
    if (!user) {
      return authFail("LOGIN_REQUIRED");
    }

    const updated: User = {
      ...user,
      premiumUntil: extendPremiumUntil(user),
    };
    updateUser(updated);
    setUser(updated);
    return { ok: true as const };
  }, [user]);

  const activatePremiumAfterPayment = useCallback(
    (premiumUntil: string) => {
      if (!user) {
        return authFail("LOGIN_REQUIRED");
      }

      const updated: User = {
        ...user,
        premiumUntil,
      };
      updateUser(updated);
      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const getVerificationTarget = useCallback(
    (method: VerificationMethod, contact: string) => {
      if (method === "email") {
        const gmailResult = validateGmail(contact);
        if (!gmailResult.ok) {
          return null;
        }
        const found = findUserByGmail(gmailResult.gmail);
        return found ? found.gmail : null;
      }

      const found = findUserByPhone(contact);
      return found ? found.koreanPhone : null;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      isReady,
      signup,
      completeGoogleSignup,
      login,
      logout,
      refreshSession,
      applyReferralCode,
      findAccountId,
      resetPassword,
      changePassword,
      changePhone,
      updateBasicProfile,
      updateProfileImage,
      subscribePremium,
      activatePremiumAfterPayment,
      getVerificationTarget,
    }),
    [
      user,
      isReady,
      signup,
      completeGoogleSignup,
      login,
      logout,
      refreshSession,
      applyReferralCode,
      findAccountId,
      resetPassword,
      changePassword,
      changePhone,
      updateBasicProfile,
      updateProfileImage,
      subscribePremium,
      activatePremiumAfterPayment,
      getVerificationTarget,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
