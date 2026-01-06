import { AlertCircle, MapPin } from "lucide-react";
import type { FC } from "react";
import type { ShippingAddress } from "../../stores/cartStore";
import { getInputBorderClass, TAIWAN_CITIES } from "./checkout-form-utils";

type ShippingAddressSectionProps = {
  shippingAddress: ShippingAddress;
  formErrors: Record<string, string>;
  onFieldChange: (field: keyof ShippingAddress, value: string) => void;
  onFieldBlur: (field: string, value: string) => void;
};

const ShippingAddressSection: FC<ShippingAddressSectionProps> = ({
  shippingAddress,
  formErrors,
  onFieldChange,
  onFieldBlur,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-6 flex items-center gap-2">
        <MapPin className="h-6 w-6 text-primary" />
        <h2 className="font-semibold text-gray-900 text-xl dark:text-white">
          配送地址
        </h2>
      </div>
      <div className="space-y-6">
        {/* Name and Phone Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Shipping Name */}
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="shipping-name"
            >
              收件人姓名 *
            </label>
            <input
              className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors["shipping-name"])}`}
              id="shipping-name"
              onBlur={(e) => onFieldBlur("shipping-name", e.target.value)}
              onChange={(e) => onFieldChange("name", e.target.value)}
              type="text"
              value={shippingAddress.name}
            />
            {!!formErrors["shipping-name"] && (
              <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {String(formErrors["shipping-name"])}
              </p>
            )}
          </div>

          {/* Shipping Phone */}
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="shipping-phone"
            >
              收件人手機 *
            </label>
            <input
              className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors["shipping-phone"])}`}
              id="shipping-phone"
              onBlur={(e) => onFieldBlur("shipping-phone", e.target.value)}
              onChange={(e) => onFieldChange("phone", e.target.value)}
              type="tel"
              value={shippingAddress.phone}
            />
            {!!formErrors["shipping-phone"] && (
              <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {String(formErrors["shipping-phone"])}
              </p>
            )}
          </div>
        </div>

        {/* City and District Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* City */}
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="city"
            >
              城市 *
            </label>
            <select
              className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors["shipping-city"])}`}
              id="city"
              onBlur={(e) => onFieldBlur("shipping-city", e.target.value)}
              onChange={(e) => onFieldChange("city", e.target.value)}
              value={shippingAddress.city}
            >
              <option value="">請選擇</option>
              {TAIWAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {!!formErrors["shipping-city"] && (
              <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {String(formErrors["shipping-city"])}
              </p>
            )}
          </div>

          {/* District */}
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="district"
            >
              區域 *
            </label>
            <input
              className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors["shipping-district"])}`}
              id="district"
              onBlur={(e) => onFieldBlur("shipping-district", e.target.value)}
              onChange={(e) => onFieldChange("district", e.target.value)}
              placeholder="例：信義區"
              type="text"
              value={shippingAddress.district}
            />
            {!!formErrors["shipping-district"] && (
              <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {String(formErrors["shipping-district"])}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label
            className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="address"
          >
            詳細地址 *
          </label>
          <input
            className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors["shipping-address"])}`}
            id="address"
            onBlur={(e) => onFieldBlur("shipping-address", e.target.value)}
            onChange={(e) => onFieldChange("address", e.target.value)}
            placeholder="例：忠孝東路四段123號5樓"
            type="text"
            value={shippingAddress.address}
          />
          {!!formErrors["shipping-address"] && (
            <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {String(formErrors["shipping-address"])}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressSection;
