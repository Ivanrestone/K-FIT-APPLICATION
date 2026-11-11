import SubscriptionPaywall from "@/components/SubscriptionPaywall";

type Props = {
  onCheckoutComplete?: () => Promise<void> | void;
};

export default function MemberPaymentOptions({ onCheckoutComplete }: Props = {}) {
  return <SubscriptionPaywall onCheckoutComplete={onCheckoutComplete} />;
}
