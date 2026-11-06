import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FeatherIconName = keyof typeof Feather.glyphMap;

type Product = {
  id: number;
  name: string;
  price: number;
  category: "Supplements" | "Gear" | "Drinks" | "Snacks";
  icon: FeatherIconName;
  stock: number;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "CyberWhey Isolate Protein",
    price: 49.99,
    category: "Supplements",
    icon: "droplet",
    stock: 14,
  },
  {
    id: 2,
    name: "Pre-Workout Ignite Powder",
    price: 34.99,
    category: "Supplements",
    icon: "zap",
    stock: 8,
  },
  {
    id: 3,
    name: "KFIT Neon Lifting Straps",
    price: 18.5,
    category: "Gear",
    icon: "link",
    stock: 22,
  },
  {
    id: 4,
    name: "ElectroHydrate Drink 500ml",
    price: 4.0,
    category: "Drinks",
    icon: "coffee",
    stock: 40,
  },
  {
    id: 5,
    name: "High Protein Oat Bar",
    price: 3.5,
    category: "Snacks",
    icon: "package",
    stock: 32,
  },
  {
    id: 6,
    name: "KFIT Cyberpunk Gym Towel",
    price: 15.0,
    category: "Gear",
    icon: "layers",
    stock: 18,
  },
];

const CATEGORIES = ["All", "Supplements", "Gear", "Drinks", "Snacks"] as const;
const METHODS = [
  { key: "Card", icon: "credit-card" as FeatherIconName },
  { key: "Cash", icon: "dollar-sign" as FeatherIconName },
  { key: "Digital", icon: "smartphone" as FeatherIconName },
] as const;
type Method = (typeof METHODS)[number]["key"];

const TAX_RATE = 0.08;
const money = (n: number) => `$${n.toFixed(2)}`;

export default function TrainerPosScreen() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [method, setMethod] = useState<Method>("Card");
  const [receipt, setReceipt] = useState<{
    id: string;
    total: number;
    tax: number;
    subtotal: number;
    itemCount: number;
    method: Method;
  } | null>(null);

  const visible = useMemo(
    () =>
      category === "All"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === category),
    [category],
  );

  const lines = useMemo(
    () =>
      PRODUCTS.filter((p) => cart[p.id]).map((p) => ({
        product: p,
        qty: cart[p.id],
      })),
    [cart],
  );
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const countFor = (cat: (typeof CATEGORIES)[number]) =>
    cat === "All"
      ? PRODUCTS.length
      : PRODUCTS.filter((p) => p.category === cat).length;

  const add = (id: number) => {
    void Haptics.selectionAsync();
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  };

  const remove = (id: number) => {
    void Haptics.selectionAsync();
    setCart((c) => {
      const next = { ...c };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  };

  const checkout = () => {
    if (itemCount === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const receiptId = `KF-${Date.now().toString().slice(-6)}`;
    setReceipt({
      id: receiptId,
      total,
      tax,
      subtotal,
      itemCount,
      method,
    });
    setCart({});
    setCartOpen(false);
  };

  const cartButton = (
    <TouchableOpacity
      style={styles.cartButton}
      onPress={() => setCartOpen(true)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open cart, ${itemCount} items, total ${money(total)}`}
    >
      <Feather name="shopping-bag" size={14} color={KFitColors.onAccent} />
      <Text style={styles.cartButtonText}>Cart</Text>
      <View style={styles.cartCount}>
        <Text style={styles.cartCountText}>{itemCount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TrainerScreenShell
      eyebrow="STORE & SUPPLEMENTS"
      title="POS Terminal"
      activeRoute="/trainer-pos"
      headerRight={cartButton}
    >
      {/* Stat strip */}
      <View style={styles.statCard}>
        <StatInline
          icon="shopping-bag"
          label="Items"
          value={String(itemCount)}
          tone={KFitColors.accent}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="dollar-sign"
          label="Total"
          value={money(total)}
          tone="#F59E0B"
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="box"
          label="Products"
          value={String(PRODUCTS.length)}
          tone={KFitColors.text}
        />
        <View style={styles.statDivider} />
        <StatInline
          icon="tag"
          label="Category"
          value={category === "All" ? "All" : category}
          tone={KFitColors.mutedText}
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORIES.map((c) => {
          const selected = c === category;
          const count = countFor(c);
          return (
            <TouchableOpacity
              key={c}
              onPress={() => {
                void Haptics.selectionAsync();
                setCategory(c);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${c}, ${count} products`}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextActive]}
              >
                {c}
              </Text>
              <View
                style={[styles.chipCount, selected && styles.chipCountActive]}
              >
                <Text
                  style={[
                    styles.chipCountText,
                    selected && styles.chipCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Product grid */}
      <View style={styles.grid}>
        {visible.map((p) => {
          const qty = cart[p.id] ?? 0;
          const inCart = qty > 0;
          return (
            <View
              key={p.id}
              style={[styles.product, inCart && styles.productInCart]}
            >
              <View>
                <View style={styles.productIcon}>
                  <Feather name={p.icon} size={15} color={KFitColors.accent} />
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.productCategory}>
                  {p.category.toUpperCase()}
                </Text>
              </View>

              <View style={styles.productBottom}>
                <View>
                  <Text style={styles.price}>{money(p.price)}</Text>
                  <Text style={styles.priceUnit}>/ each</Text>
                </View>

                {/* ─── Add button ↔ Inline stepper ─── */}
                {!inCart ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => add(p.id)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${p.name} to cart`}
                  >
                    <Feather name="plus" size={11} color={KFitColors.text} />
                    <Text style={styles.addText}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inlineStepper}>
                    <TouchableOpacity
                      style={styles.inlineStepBtn}
                      onPress={() => remove(p.id)}
                      activeOpacity={0.85}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove one ${p.name}`}
                    >
                      <Feather
                        name="minus"
                        size={11}
                        color={KFitColors.accent}
                      />
                    </TouchableOpacity>
                    <Text style={styles.inlineQty}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.inlineStepBtn}
                      onPress={() => add(p.id)}
                      activeOpacity={0.85}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Add one ${p.name}`}
                    >
                      <Feather
                        name="plus"
                        size={11}
                        color={KFitColors.accent}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Cart / payment modal */}
      <Modal
        visible={cartOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCartOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Feather
                    name="shopping-bag"
                    size={12}
                    color={KFitColors.accent}
                  />
                </View>
                <Text style={styles.modalTitle}>Checkout</Text>
                <View style={styles.modalItemBadge}>
                  <Text style={styles.modalItemBadgeText}>{itemCount}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCartOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close cart"
              >
                <Feather name="x" size={16} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.cartList}
              contentContainerStyle={{ gap: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {lines.length === 0 ? (
                <View style={styles.emptyCart}>
                  <View style={styles.emptyCartIcon}>
                    <Feather
                      name="shopping-bag"
                      size={20}
                      color={KFitColors.accent}
                    />
                  </View>
                  <Text style={styles.emptyCartTitle}>Cart is empty</Text>
                  <Text style={styles.emptyCartText}>
                    Tap a product above to add it here.
                  </Text>
                </View>
              ) : (
                lines.map(({ product, qty }) => (
                  <View key={product.id} style={styles.cartRow}>
                    <View style={styles.cartIcon}>
                      <Feather
                        name={product.icon}
                        size={12}
                        color={KFitColors.accent}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.cartName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.cartUnit}>
                        {money(product.price)} each
                      </Text>
                    </View>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => remove(product.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove one ${product.name}`}
                      >
                        <Feather
                          name="minus"
                          size={12}
                          color={KFitColors.text}
                        />
                      </TouchableOpacity>
                      <Text style={styles.qty}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => add(product.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Add one ${product.name}`}
                      >
                        <Feather
                          name="plus"
                          size={12}
                          color={KFitColors.text}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.lineTotal}>
                      {money(product.price * qty)}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
            <View style={styles.methodRow}>
              {METHODS.map((m) => {
                const selected = m.key === method;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.method, selected && styles.methodActive]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setMethod(m.key);
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Feather
                      name={m.icon}
                      size={13}
                      color={
                        selected ? KFitColors.accent : KFitColors.mutedText
                      }
                    />
                    <Text
                      style={[
                        styles.methodText,
                        selected && styles.methodTextActive,
                      ]}
                    >
                      {m.key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.subLabel}>Subtotal</Text>
                <Text style={styles.subValue}>{money(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.subLabel}>Tax (8%)</Text>
                <Text style={styles.subValue}>{money(tax)}</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{money(total)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payButton, itemCount === 0 && styles.disabled]}
              onPress={checkout}
              disabled={itemCount === 0}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Pay ${money(total)} by ${method}`}
            >
              <Feather name="lock" size={13} color={KFitColors.onAccent} />
              <Text style={styles.payText}>Complete · {money(total)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt modal */}
      <Modal
        visible={!!receipt}
        transparent
        animationType="fade"
        onRequestClose={() => setReceipt(null)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, styles.receiptCard]}>
            <View style={styles.receiptIcon}>
              <Feather
                name="check-circle"
                size={28}
                color={KFitColors.accent}
              />
            </View>
            <Text style={styles.receiptTitle}>Payment complete</Text>
            <Text style={styles.receiptSub}>
              {receipt
                ? `Paid by ${receipt.method} · ${receipt.itemCount} items`
                : ""}
            </Text>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Subtotal</Text>
              <Text style={styles.receiptValue}>
                {receipt ? money(receipt.subtotal) : ""}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Tax</Text>
              <Text style={styles.receiptValue}>
                {receipt ? money(receipt.tax) : ""}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>Total</Text>
              <Text style={styles.receiptTotalValue}>
                {receipt ? money(receipt.total) : ""}
              </Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptIdRow}>
              <Text style={styles.receiptIdLabel}>TRANSACTION</Text>
              <Text style={styles.receiptId}>{receipt?.id ?? ""}</Text>
            </View>

            <TouchableOpacity
              style={styles.payButton}
              onPress={() => setReceipt(null)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Feather name="plus" size={13} color={KFitColors.onAccent} />
              <Text style={styles.payText}>New sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TrainerScreenShell>
  );
}

function StatInline({
  icon,
  label,
  value,
  tone,
}: {
  icon: FeatherIconName;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View style={styles.statInline}>
      <View style={styles.statInlineHeader}>
        <Feather name={icon} size={10} color={tone} />
        <Text
          style={[styles.statInlineValue, { color: tone }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Text style={styles.statInlineLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.4 },

  /* Cart button */
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  cartButtonText: {
    color: KFitColors.onAccent,
    fontSize: 12,
    fontWeight: "900",
  },
  cartCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  cartCountText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Stat strip */
  statCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  statInline: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
  },
  statInlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statInlineValue: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.2,
  },
  statInlineLabel: {
    fontSize: 8,
    color: KFitColors.mutedText,
    letterSpacing: 0.8,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 8,
  },

  /* Category chips */
  chipRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  chipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  chipText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  chipTextActive: { color: KFitColors.onAccent, fontWeight: "900" },
  chipCount: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: KFitColors.background,
    borderWidth: 1,
    borderColor: KFitColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountActive: {
    backgroundColor: KFitColors.onAccent + "22",
    borderColor: KFitColors.onAccent + "44",
  },
  chipCountText: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  chipCountTextActive: { color: KFitColors.onAccent },

  /* Product grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  product: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 155,
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
  },
  productInCart: {
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "05",
  },
  productIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productName: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  productCategory: {
    color: KFitColors.mutedText,
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: 4,
    fontFamily: "monospace",
  },
  productBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  price: {
    color: KFitColors.accent,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.2,
  },
  priceUnit: {
    color: KFitColors.mutedText,
    fontSize: 9,
    fontFamily: "monospace",
    marginTop: 1,
  },

  /* Add button (not in cart) */
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  addText: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  /* Inline stepper (in cart) */
  inlineStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "10",
  },
  inlineStepBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineQty: {
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
    minWidth: 16,
    textAlign: "center",
  },

  /* Modal */
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    gap: 12,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: KFitColors.border,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalHeaderIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  modalTitle: {
    color: KFitColors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  modalItemBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  modalItemBadgeText: {
    color: KFitColors.accent,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  emptyCart: { alignItems: "center", paddingVertical: 24, gap: 6 },
  emptyCartIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  emptyCartTitle: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyCartText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
  },

  cartList: { maxHeight: 240 },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: KFitColors.background,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
  },
  cartIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
  },
  cartName: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  cartUnit: {
    color: KFitColors.mutedText,
    fontSize: 10,
    marginTop: 1,
    fontFamily: "monospace",
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "900",
    minWidth: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },
  lineTotal: {
    width: 56,
    textAlign: "right",
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  fieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    fontWeight: "900",
    marginTop: 4,
  },
  methodRow: { flexDirection: "row", gap: 6 },
  method: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  methodActive: {
    borderColor: KFitColors.accent + "55",
    backgroundColor: KFitColors.accent + "14",
  },
  methodText: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontWeight: "800",
  },
  methodTextActive: { color: KFitColors.accent },

  totals: {
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subLabel: { color: KFitColors.mutedText, fontSize: 11 },
  subValue: {
    color: KFitColors.mutedText,
    fontSize: 11,
    fontFamily: "monospace",
  },
  totalDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 4,
  },
  totalLabel: {
    color: KFitColors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  totalValue: {
    color: KFitColors.accent,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },

  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  payText: {
    color: KFitColors.onAccent,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Receipt */
  receiptCard: { alignItems: "stretch", maxWidth: 340 },
  receiptIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KFitColors.accent + "14",
    borderWidth: 1,
    borderColor: KFitColors.accent + "44",
    marginBottom: 4,
  },
  receiptTitle: {
    color: KFitColors.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  receiptSub: {
    color: KFitColors.mutedText,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "monospace",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: KFitColors.border,
    marginVertical: 4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  receiptLabel: { color: KFitColors.mutedText, fontSize: 11 },
  receiptValue: {
    color: KFitColors.text,
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  receiptTotalLabel: {
    color: KFitColors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  receiptTotalValue: {
    color: KFitColors.accent,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.3,
  },
  receiptIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptIdLabel: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontFamily: "monospace",
    fontWeight: "900",
  },
  receiptId: {
    color: KFitColors.text,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
});
