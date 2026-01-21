import { Headphones, ShieldCheck, Zap } from "lucide-react";
import type { FC } from "react";
import type { CartItem } from "../../stores/cartStore";

type OrderSummarySectionProps = {
  items: CartItem[];
  subtotal: number;
  total: number;
};

const OrderSummarySection: FC<OrderSummarySectionProps> = ({
  items,
  subtotal,
  total,
}) => {
  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-6 font-semibold text-gray-900 text-xl dark:text-white">
          訂單摘要
        </h3>
        <div className="mb-6 space-y-4">
          {items.map((item) => (
            <div
              className="flex items-start gap-4"
              key={item.variantId || item.productId}
            >
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className="line-clamp-1 font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-500 text-sm dark:text-gray-400">
                  {item.variant}
                </p>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-6 border-gray-200 dark:border-zinc-700" />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-500 text-sm dark:text-gray-400">
            <span>小計</span>
            <span>NT$ {subtotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-gray-200 border-t pt-6 dark:border-zinc-700">
          <span className="font-semibold text-gray-900 text-lg dark:text-white">
            總計
          </span>
          <span className="font-bold text-2xl text-gray-900 dark:text-white">
            NT$ {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="mb-1 font-semibold text-gray-900 text-sm dark:text-white">
            安全加密
          </h4>
          <p className="text-gray-500 text-xs leading-relaxed dark:text-gray-400">
            您的付款資訊經過 256 位元 SSL 加密保護。
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="mb-1 font-semibold text-gray-900 text-sm dark:text-white">
            快速出貨
          </h4>
          <p className="text-gray-500 text-xs leading-relaxed dark:text-gray-400">
            付款完成後，我們將儘速為您安排配送並發送確認信。
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <Headphones className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="mb-1 font-semibold text-gray-900 text-sm dark:text-white">
            專業客服諮詢
          </h4>
          <p className="text-gray-500 text-xs leading-relaxed dark:text-gray-400">
            如有任何產品或訂單問題，歡迎隨時與我們聯繫。
          </p>
        </div>
      </div>

      {/* Accepted Payment Methods */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h4 className="mb-4 font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
          接受的付款方式
        </h4>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-600 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-300">
            VISA
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-600 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-300">
            Mastercard
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-600 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-300">
            JCB
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-600 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-300">
            銀行轉帳
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummarySection;
