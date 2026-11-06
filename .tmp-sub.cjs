"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveSubscription = hasActiveSubscription;
exports.useSubscriptionAccess = useSubscriptionAccess;
const expo_1 = require("@clerk/expo");
const supabase_1 = require("@/utils/supabase");
const react_1 = require("react");
const react_native_1 = require("react-native");
/**
 * A plan grants access while it is flagged active or while its paid period has
 * not lapsed yet. A future `expires_at` always wins, including plans that were
 * cancelled but run to the end of the paid period.
 */
function hasActiveSubscription(subscription) {
    if (!subscription) {
        return false;
    }
    if (subscription.active) {
        return true;
    }
    if (!subscription.expiresAt) {
        return false;
    }
    const expiry = Date.parse(subscription.expiresAt);
    return Number.isFinite(expiry) && expiry > Date.now();
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseRole(value) {
    if (value === "trainer") {
        return "coach";
    }
    return value === "member" || value === "coach" || value === "admin"
        ? value
        : null;
}
function hasMissingRole(value) {
    return value === null || value === undefined || value === "";
}
function parseAmount(value) {
    const amount = typeof value === "string" ? Number(value) : value;
    return typeof amount === "number" &&
        Number.isFinite(amount) &&
        amount > 0
        ? amount
        : null;
}
function parsePlan(value) {
    if (!isRecord(value) ||
        typeof value.id !== "string" ||
        (value.plan_type !== "app" && value.plan_type !== "gym") ||
        typeof value.display_currency !== "string" ||
        !/^[A-Z]{3}$/.test(value.display_currency)) {
        return null;
    }
    const displayAmount = parseAmount(value.display_amount);
    const billingAmountPhp = parseAmount(value.billing_amount_php);
    if (displayAmount === null || billingAmountPhp === null) {
        return null;
    }
    return {
        id: value.id,
        planType: value.plan_type,
        displayAmount,
        displayCurrency: value.display_currency,
        billingAmountPhp,
    };
}
function parseDate(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value))
        ? value
        : null;
}
// Never discard a subscription row because one column is shaped unexpectedly:
// dropping it turns a paid plan into "Not active".
function parseSubscription(value) {
    if (!isRecord(value)) {
        return null;
    }
    return {
        active: value.active === true || value.active === "true",
        expiresAt: parseDate(value.expires_at),
        cancelledAt: parseDate(value.cancelled_at),
    };
}
function getErrorMessage(error) {
    return error instanceof Error
        ? error.message
        : "Could not load subscription information. Please try again.";
}
function useSubscriptionAccess() {
    const { getToken, isLoaded, isSignedIn, userId } = (0, expo_1.useAuth)();
    const { user } = (0, expo_1.useUser)();
    // Supabase RLS reads `auth.jwt() ->> 'sub'`, which only exists on the Clerk
    // JWT template named `supabase`; the default Clerk session token is rejected
    // (401/406) and makes a paid plan look inactive.
    const getSupabaseToken = (0, react_1.useCallback)(async () => {
        try {
            const templateToken = await getToken({ template: "supabase" });
            if (templateToken) {
                return templateToken;
            }
        }
        catch (error) {
            console.warn("[Subscription Token Notice]:", error instanceof Error ? error.message : String(error));
        }
        return getToken();
    }, [getToken]);
    const metadataRoleRef = (0, react_1.useRef)(undefined);
    (0, react_1.useEffect)(() => {
        metadataRoleRef.current = user?.publicMetadata?.role;
    }, [user]);
    const supabaseConfigured = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL &&
        process.env.EXPO_PUBLIC_SUPABASE_KEY);
    const clientResult = (0, react_1.useMemo)(() => {
        if (!supabaseConfigured) {
            return { client: null, error: null };
        }
        try {
            return {
                client: (0, supabase_1.createMemberSupabaseClient)(() => isSignedIn ? getSupabaseToken() : Promise.resolve(null)),
                error: null,
            };
        }
        catch {
            return {
                client: null,
                error: "Supabase configuration is invalid.",
            };
        }
    }, [getSupabaseToken, isSignedIn, supabaseConfigured]);
    const supabase = clientResult.client;
    const [queryState, setQueryState] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [loadError, setLoadError] = (0, react_1.useState)(null);
    const activeUserIdRef = (0, react_1.useRef)(null);
    const latestLoadIdRef = (0, react_1.useRef)(0);
    const load = (0, react_1.useCallback)(async () => {
        if (!supabase ||
            !isSignedIn ||
            !userId ||
            activeUserIdRef.current !== userId) {
            return;
        }
        const loadId = ++latestLoadIdRef.current;
        try {
            const [profileResult, plansResult] = await Promise.all([
                supabase
                    .from("users")
                    .select("role")
                    .eq("id", userId)
                    .maybeSingle(),
                supabase
                    .from("pricing_plans")
                    .select("id, plan_type, display_amount, display_currency, billing_amount_php")
                    .eq("is_active", true),
            ]);
            // A role read failure or an empty role is not fatal. Subscriptions keep
            // working with the Clerk role, defaulting to member when nothing is set.
            if (profileResult.error) {
                console.warn("[Subscription Role Load Notice]:", profileResult.error.message);
            }
            // Price availability must not hide an already-paid subscription; only the
            // checkout buttons depend on it.
            if (plansResult.error) {
                console.warn("[Subscription Plans Load Notice]:", plansResult.error.message);
            }
            let role = (profileResult.data
                ? parseRole(profileResult.data.role)
                : null) ??
                parseRole(metadataRoleRef.current) ??
                "member";
            let isProvisioned = profileResult.data !== null;
            if (profileResult.data &&
                hasMissingRole(profileResult.data.role)) {
                const { error: roleRepairError } = await supabase
                    .from("users")
                    .update({ role: "member" })
                    .eq("id", userId);
                if (roleRepairError) {
                    console.warn("[Subscription Role Repair Notice]:", roleRepairError.message);
                }
            }
            const parsedPlans = (plansResult.data ?? []).map((plan) => parsePlan(plan));
            if (parsedPlans.some((plan) => plan === null)) {
                throw new Error("Subscription prices returned invalid data.");
            }
            const plans = parsedPlans.filter((plan) => plan !== null);
            // Server-side snapshot used when the anon RLS path cannot read the rows
            // (expired/missing Clerk JWT, or a token without the `sub` claim).
            const loadServerSnapshot = async () => {
                try {
                    const { data: snapshot, error: snapshotError } = await supabase
                        .functions.invoke("subscription-status", { body: {} });
                    if (snapshotError) {
                        console.warn("[Subscription Fallback Notice]:", snapshotError.message);
                        return null;
                    }
                    if (!isRecord(snapshot)) {
                        return null;
                    }
                    return {
                        role: parseRole(snapshot.role),
                        isProvisioned: snapshot.isProvisioned === true,
                        app: parseSubscription(snapshot.app),
                        gym: parseSubscription(snapshot.gym),
                    };
                }
                catch (fallbackError) {
                    console.warn("[Subscription Fallback Notice]:", getErrorMessage(fallbackError));
                    return null;
                }
            };
            let appRaw = null;
            let gymRaw = null;
            let subscriptionError = null;
            if (role === "member" || role === "coach") {
                const [appResult, gymResult] = await Promise.all([
                    supabase
                        .from("subscriptions_app")
                        .select("active, expires_at, cancelled_at")
                        .eq("user_id", userId)
                        .maybeSingle(),
                    role === "member"
                        ? supabase
                            .from("subscriptions_gym")
                            .select("active, expires_at, cancelled_at")
                            .eq("user_id", userId)
                            .maybeSingle()
                        : Promise.resolve({ data: null, error: null }),
                ]);
                appRaw = appResult.data;
                gymRaw = gymResult.data;
                subscriptionError = appResult.error?.message ??
                    gymResult.error?.message ??
                    null;
                if (subscriptionError) {
                    console.warn("[Subscription Load Notice]:", subscriptionError);
                }
                // RLS failures and empty results both fall through to the Edge
                // Function, which verifies the Clerk session and reads with the
                // service role instead of trusting a client-side "no rows".
                if (appResult.error || gymResult.error || (!appRaw && !gymRaw)) {
                    const snapshot = await loadServerSnapshot();
                    if (snapshot) {
                        appRaw = appRaw ?? snapshot.app;
                        gymRaw = gymRaw ?? snapshot.gym;
                        isProvisioned = isProvisioned || snapshot.isProvisioned;
                        if (!profileResult.data && snapshot.role) {
                            role = snapshot.role;
                        }
                    }
                    else if (subscriptionError && !appRaw && !gymRaw) {
                        // Both the RLS read and the server fallback failed: report it
                        // instead of rendering a false "Not active".
                        throw new Error("Could not load subscription status.");
                    }
                }
            }
            const appSubscription = parseSubscription(appRaw);
            const gymSubscription = role === "member"
                ? parseSubscription(gymRaw)
                : null;
            console.log("[Subscription Debug] Clerk User ID:", userId, "App Sub:", appSubscription, "Gym Sub:", gymSubscription, "Error:", subscriptionError);
            console.log("[Subscription Debug] Evaluation:", {
                role,
                isProvisioned,
                appActive: hasActiveSubscription(appSubscription),
                appRaw,
                gymRaw,
            });
            const data = {
                userId,
                role,
                isProvisioned,
                subscriptionStatus: hasActiveSubscription(appSubscription)
                    ? "active"
                    : "inactive",
                plans,
                appSubscription,
                gymSubscription,
            };
            if (activeUserIdRef.current !== userId ||
                latestLoadIdRef.current !== loadId) {
                return;
            }
            setLoadError(null);
            setQueryState({ data, isRefreshing: false, error: null });
        }
        catch (error) {
            if (activeUserIdRef.current !== userId ||
                latestLoadIdRef.current !== loadId) {
                return;
            }
            const message = getErrorMessage(error);
            console.warn("[Subscription Debug] Clerk User ID:", userId, "App Sub:", null, "Gym Sub:", null, "Error:", message);
            setLoadError({ userId, message });
            setQueryState((current) => current?.data.userId === userId
                ? { ...current, isRefreshing: false, error: message }
                : null);
        }
        finally {
            if (activeUserIdRef.current === userId &&
                latestLoadIdRef.current === loadId) {
                setIsLoading(false);
            }
        }
    }, [isSignedIn, supabase, userId]);
    (0, react_1.useEffect)(() => {
        if (!isLoaded) {
            return;
        }
        void Promise.resolve().then(() => {
            const activeUserId = isSignedIn && userId ? userId : null;
            activeUserIdRef.current = activeUserId;
            latestLoadIdRef.current += 1;
            if (!isSignedIn || !userId) {
                setQueryState(null);
                setLoadError(null);
                setIsLoading(false);
                return;
            }
            setQueryState((current) => current?.data.userId === userId ? current : null);
            setLoadError((current) => current?.userId === userId ? current : null);
            setIsLoading(true);
        });
    }, [isLoaded, isSignedIn, userId]);
    (0, react_1.useEffect)(() => {
        if (!isLoaded || !isSignedIn || !userId || !supabase) {
            return;
        }
        void Promise.resolve().then(load);
    }, [isLoaded, isSignedIn, load, supabase, userId]);
    const refresh = (0, react_1.useCallback)(() => {
        if (!supabase || !isSignedIn || !userId) {
            return;
        }
        setQueryState((current) => current?.data.userId === userId
            ? { ...current, isRefreshing: true }
            : current);
        void load();
    }, [isSignedIn, load, supabase, userId]);
    // PayMongo confirms payment in the system browser while the app is
    // backgrounded, so re-read the Supabase subscription rows when the member
    // returns to the app instead of waiting for a manual refresh.
    (0, react_1.useEffect)(() => {
        if (!isSignedIn || !userId) {
            return;
        }
        let previousState = react_native_1.AppState.currentState;
        const listener = react_native_1.AppState.addEventListener("change", (nextState) => {
            const returnedToForeground = nextState === "active" &&
                previousState !== "active";
            previousState = nextState;
            if (returnedToForeground) {
                void load();
            }
        });
        return () => listener.remove();
    }, [isSignedIn, load, userId]);
    const currentQueryState = isSignedIn && queryState &&
        queryState.data.userId === userId
        ? queryState
        : null;
    const currentLoadError = isSignedIn && loadError &&
        loadError.userId === userId
        ? loadError
        : null;
    const data = currentQueryState?.data ?? null;
    const error = clientResult.error ??
        currentLoadError?.message ??
        currentQueryState?.error ??
        null;
    return {
        data,
        error,
        isLoaded,
        isSignedIn,
        isLoading: !isLoaded ||
            (isSignedIn && !error && (isLoading || data === null)),
        isRefreshing: currentQueryState?.isRefreshing ?? false,
        refresh,
        supabase,
    };
}
