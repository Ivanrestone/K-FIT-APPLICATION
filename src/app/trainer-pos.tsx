import TrainerScreenShell from "@/components/TrainerScreenShell";
import { KFitColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
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
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "CyberWhey Isolate Protein",
    price: 49.99,
    category: "Supplements",
    icon: "droplet",
  },
  {
    id: 2,
    name: "Pre-Workout Ignite Powder",
    price: 34.99,
    category: "Supplements",
    icon: "zap",
  },
  {
    id: 3,
    name: "KFIT Neon Lifting Straps",
    price: 18.5,
    category: "Gear",
    icon: "link",
  },
  {
    id: 4,
    name: "ElectroHydrate Drink 500ml",
    price: 4.0,
    category: "Drinks",
    icon: "coffee",
  },
  {
    id: 5,
    name: "High Protein Oat Bar",
    price: 3.5,
    category: "Snacks",
    icon: "package",
  },
  {
    id: 6,
    name: "KFIT Cyberpunk Gym Towel",
    price: 15.0,
    category: "Gear",
    icon: "layers",
  },
];

const CATEGORIES = ["All", "Supplements", "Gear", "Drinks", "Snacks"] as const;
const METHODS = ["Card", "Cash", "Digital"] as const;
type Method = (typeof METHODS)[number];

const money = (n: number) => `$${n.toFixed(2)}`;

export default function TrainerPosScreen() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [method, setMethod] = useState<Method>("Card");
  const [receipt, setReceipt] = useState<{
    total: number;
    method: Method;
  } | null>(null);

  const visible =
    category === "All"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === category);

  const lines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({
    product: p,
    qty: cart[p.id],
  }));
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  const add = (id: number) => {
    void Haptics.selectionAsync();
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  };

  const remove = (id: number) =>
    setCart((c) => {
      const next = { ...c };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });

  const checkout = () => {
    if (itemCount === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReceipt({ total, method });
    setCart({});
    setCartOpen(false);
  };

  const cartButton = (
    <TouchableOpacity
      style={styles.cartButton}
      onPress={() => setCartOpen(true)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Open cart, ${itemCount} items`}
    >
      <Feather name="shopping-cart" size={15} color={KFitColors.onAccent} />
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextActive]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.grid}>
        {visible.map((p) => {
          const qty = cart[p.id] ?? 0;
          return (
            <View key={p.id} style={styles.product}>
              <View>
                <View style={styles.productIcon}>
                  <Feather name={p.icon} size={16} color={KFitColors.accent} />
                </View>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productCategory}>
                  {p.category.toUpperCase()}
                </Text>
              </View>
              <View style={styles.productBottom}>
                <Text style={styles.price}>{money(p.price)}</Text>
                <TouchableOpacity
                  style={[styles.addButton, qty > 0 && styles.addButtonActive]}
                  onPress={() => add(p.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${p.name} to cart`}
                >
                  <Text
                    style={[
                      styles.addText,
                      qty > 0 && { color: KFitColors.onAccent },
                    ]}
                  >
                    {qty > 0 ? `+ Add (${qty})` : "+ Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* ---------------- Cart / payment modal ---------------- */}
      <Modal
        visible={cartOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCartOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CHECKOUT CART</Text>
              <TouchableOpacity
                onPress={() => setCartOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close cart"
              >
                <Feather name="x" size={18} color={KFitColors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.cartList}
              contentContainerStyle={{ gap: 8 }}
            >
              {lines.length === 0 ? (
                <Text style={styles.empty}>
                  Your POS cart is currently empty.
                </Text>
              ) : (
                lines.map(({ product, qty }) => (
                  <View key={product.id} style={styles.cartRow}>
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
                          size={13}
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
                          size={13}
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
                const selected = m === method;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.method, selected && styles.methodActive]}
                    onPress={() => setMethod(m)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        selected && styles.methodTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.subLabel}>Subtotal</Text>
                <Text style={styles.subValue}>{money(total)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{money(total)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payButton, itemCount === 0 && styles.disabled]}
              onPress={checkout}
              disabled={itemCount === 0}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.payText}>Complete POS Purchase</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------------- Receipt modal ---------------- */}
      <Modal
        visible={!!receipt}
        transparent
        animationType="fade"
        onRequestClose={() => setReceipt(null)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, styles.receiptCard]}>
            <Feather name="check-circle" size={36} color={KFitColors.accent} />
            <Text style={styles.receiptTitle}>Transaction Complete</Text>
            <Text style={styles.receiptBody}>
              {receipt
                ? `${money(receipt.total)} paid by ${receipt.method}. `
                : ""}
              Receipt generated and payment approved via KFIT POS.
            </Text>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => setReceipt(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.payText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TrainerScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.4 },
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
    fontWeight: "800",
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
  cartCountText: { color: KFitColors.accent, fontSize: 10, fontWeight: "800" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
  },
  chipActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  chipText: { color: KFitColors.mutedText, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: KFitColors.onAccent, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  product: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 150,
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: KFitColors.surface,
    borderWidth: 1,
    borderColor: KFitColors.border,
    borderRadius: 14,
    padding: 12,
  },
  productIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: KFitColors.accent + "1A",
    borderWidth: 1,
    borderColor: KFitColors.accent + "33",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productName: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  productCategory: {
    color: KFitColors.mutedText,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 4,
  },
  productBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  price: {
    color: KFitColors.accent,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  addButtonActive: {
    backgroundColor: KFitColors.accent,
    borderColor: KFitColors.accent,
  },
  addText: { color: KFitColors.text, fontSize: 11, fontWeight: "800" },

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
    padding: 20,
    borderRadius: 16,
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
  modalTitle: { color: KFitColors.text, fontSize: 14, fontWeight: "900" },
  cartList: { maxHeight: 220 },
  empty: {
    color: KFitColors.mutedText,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 20,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: KFitColors.background,
    borderRadius: 10,
    padding: 8,
  },
  cartName: { color: KFitColors.text, fontSize: 12, fontWeight: "700" },
  cartUnit: { color: KFitColors.mutedText, fontSize: 10, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    color: KFitColors.text,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 14,
    textAlign: "center",
  },
  lineTotal: {
    width: 58,
    textAlign: "right",
    color: KFitColors.accent,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  fieldLabel: {
    color: KFitColors.mutedText,
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  methodRow: { flexDirection: "row", gap: 8 },
  method: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KFitColors.border,
    backgroundColor: KFitColors.background,
  },
  methodActive: {
    borderColor: KFitColors.accent,
    backgroundColor: KFitColors.accent + "26",
  },
  methodText: { color: KFitColors.mutedText, fontSize: 12, fontWeight: "700" },
  methodTextActive: { color: KFitColors.accent },
  totals: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KFitColors.border,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  subLabel: { color: KFitColors.mutedText, fontSize: 12 },
  subValue: {
    color: KFitColors.mutedText,
    fontSize: 12,
    fontFamily: "monospace",
  },
  totalLabel: { color: KFitColors.text, fontSize: 14, fontWeight: "800" },
  totalValue: {
    color: KFitColors.accent,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  payButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: KFitColors.accent,
  },
  payText: { color: KFitColors.onAccent, fontSize: 13, fontWeight: "800" },
  receiptCard: { alignItems: "center", maxWidth: 320 },
  receiptTitle: { color: KFitColors.text, fontSize: 16, fontWeight: "800" },
  receiptBody: {
    color: KFitColors.mutedText,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
