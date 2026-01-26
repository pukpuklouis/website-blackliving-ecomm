/**
 * AddressManager Component
 * Handles CRUD operations for customer addresses with proper error handling
 */

import type {
  AddressCreateRequest,
  CustomerAddress,
} from "@blackliving/types/profile";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@blackliving/ui";
import {
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAddresses } from "../../hooks/use-addresses";
import { taiwanAddressData, taiwanPostalCodes } from "../../lib/taiwan-data";
import { validateAddress } from "../../lib/validation";

type AddressManagerProps = {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
};

type AddressFormData = {
  type: "shipping" | "billing" | "both";
  label: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  postalCode: string;
  street: string;
  building: string;
  floor: string;
  room: string;
  deliveryInstructions: string;
  accessCode: string;
  isDefault: boolean;
};

const initialFormData: AddressFormData = {
  type: "shipping",
  label: "",
  recipientName: "",
  recipientPhone: "",
  city: "",
  district: "",
  postalCode: "",
  street: "",
  building: "",
  floor: "",
  room: "",
  deliveryInstructions: "",
  accessCode: "",
  isDefault: false,
};

// Helper function to get address type label
function getAddressTypeLabel(type: "shipping" | "billing" | "both"): string {
  if (type === "shipping") {
    return "收貨";
  }
  if (type === "billing") {
    return "帳單";
  }
  return "收貨+帳單";
}

// Helper function to format full address
function formatFullAddress(address: CustomerAddress): string {
  const parts = [
    address.city,
    address.district,
    address.street,
    address.building ? ` ${address.building}` : "",
    address.floor ? ` ${address.floor}` : "",
    address.room ? ` ${address.room}` : "",
  ];
  return parts.filter(Boolean).join("");
}

// Helper function to prepare address data from form
function prepareAddressData(formData: AddressFormData): AddressCreateRequest {
  return {
    type: formData.type,
    label: formData.label || undefined,
    recipientName: formData.recipientName,
    recipientPhone: formData.recipientPhone,
    city: formData.city,
    district: formData.district,
    postalCode: formData.postalCode,
    street: formData.street,
    building: formData.building || undefined,
    floor: formData.floor || undefined,
    room: formData.room || undefined,
    deliveryInstructions: formData.deliveryInstructions || undefined,
    accessCode: formData.accessCode || undefined,
    isDefault: formData.isDefault,
  };
}

// Helper function to convert address to form data
function addressToFormData(address: CustomerAddress): AddressFormData {
  return {
    type: address.type,
    label: address.label || "",
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    city: address.city,
    district: address.district,
    postalCode: address.postalCode,
    street: address.street,
    building: address.building || "",
    floor: address.floor || "",
    room: address.room || "",
    deliveryInstructions: address.deliveryInstructions || "",
    accessCode: address.accessCode || "",
    isDefault: address.isDefault,
  };
}

// Address Card Component
type AddressCardProps = {
  address: CustomerAddress;
  onEdit: (address: CustomerAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
};

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <Card className="relative transition-shadow duration-200 hover:shadow-md">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              {address.label ? (
                <Badge variant="outline">{address.label}</Badge>
              ) : null}
              <Badge
                variant={address.type === "both" ? "default" : "secondary"}
              >
                {getAddressTypeLabel(address.type)}
              </Badge>
              {address.isDefault ? (
                <Badge variant="default">
                  <Star className="mr-1 h-3 w-3" />
                  預設
                </Badge>
              ) : null}
            </div>

            <p className="font-medium">{address.recipientName}</p>
            <p className="text-gray-600 text-sm">{address.recipientPhone}</p>
            <p className="mt-1 text-gray-700 text-sm">
              {formatFullAddress(address)}
            </p>

            {address.deliveryInstructions ? (
              <p className="mt-1 text-gray-500 text-xs">
                配送備註：{address.deliveryInstructions}
              </p>
            ) : null}
          </div>

          <div className="flex items-center space-x-2">
            {!address.isDefault && (
              <Button
                onClick={() => onSetDefault(address.id)}
                size="sm"
                title="設為預設"
                variant="ghost"
              >
                <StarOff className="h-4 w-4" />
              </Button>
            )}

            <Button
              onClick={() => onEdit(address)}
              size="sm"
              title="編輯"
              variant="ghost"
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(address.id)}
              size="sm"
              title="刪除"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex form management with multiple handlers
export function AddressManager({
  className,
  onSuccess,
  onError,
}: AddressManagerProps) {
  const {
    addresses,
    loading,
    error,
    isEmpty,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null
  );
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Handle form input changes
  const handleInputChange = (
    field: keyof AddressFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const updates: Partial<AddressFormData> = { [field]: value };

      // Handle cascading updates for City -> District -> Postal Code
      if (field === "city") {
        updates.district = "";
        updates.postalCode = "";
      } else if (field === "district") {
        // Auto-fill postal code based on city and district
        const city = prev.city;
        const district = value as string;
        if (city && district && taiwanPostalCodes[city]?.[district]) {
          updates.postalCode = taiwanPostalCodes[city][district];
        }
      }

      return { ...prev, ...updates };
    });

    // Clear field error when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Open modal for new address
  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowModal(true);
  };

  // Open modal for editing address
  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setFormData(addressToFormData(address));
    setFormErrors({});
    setShowModal(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors = validateAddress(formData);
    if (errors) {
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = prepareAddressData(formData);

      let result: { success: boolean; message?: string; error?: string };
      if (editingAddress) {
        result = await updateAddress(editingAddress.id, addressData);
      } else {
        result = await createAddress(addressData);
      }

      if (result.success) {
        setShowModal(false);
        onSuccess?.(result.message || "地址保存成功！");
      } else {
        onError?.(result.error || "保存失敗");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "保存失敗";
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle address deletion
  const handleDelete = (addressId: string) => {
    setDeleteConfirm(addressId);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    try {
      const result = await deleteAddress(deleteConfirm);
      if (result.success) {
        onSuccess?.(result.message || "地址刪除成功！");
      } else {
        onError?.(result.error || "刪除失敗");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "刪除失敗";
      onError?.(errorMessage);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Handle setting default address
  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        onSuccess?.(result.message || "預設地址設置成功！");
      } else {
        onError?.(result.error || "設置失敗");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "設置失敗";
      onError?.(errorMessage);
    }
  };

  if (loading && isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>收貨地址</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableDistricts = formData.city
    ? taiwanAddressData[formData.city] || []
    : [];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>收貨地址</CardTitle>
        <Dialog onOpenChange={setShowModal} open={showModal}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新增地址
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "編輯地址" : "新增地址"}
              </DialogTitle>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Address Type */}
              <div className="space-y-2">
                <Label>地址類型 *</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange(
                      "type",
                      value as "shipping" | "billing" | "both"
                    )
                  }
                  value={formData.type}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">收貨地址</SelectItem>
                    <SelectItem value="billing">帳單地址</SelectItem>
                    <SelectItem value="both">收貨＋帳單地址</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Label */}
              <div className="space-y-2">
                <Label htmlFor="label">地址標籤</Label>
                <Input
                  id="label"
                  onChange={(e) => handleInputChange("label", e.target.value)}
                  placeholder="例如：家裡、公司"
                  value={formData.label}
                />
              </div>

              {/* Recipient Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">收件人姓名 *</Label>
                  <Input
                    className={formErrors.recipientName ? "border-red-500" : ""}
                    id="recipientName"
                    onChange={(e) =>
                      handleInputChange("recipientName", e.target.value)
                    }
                    required
                    value={formData.recipientName}
                  />
                  {formErrors.recipientName ? (
                    <p className="text-red-500 text-sm">
                      {formErrors.recipientName}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">收件人電話 *</Label>
                  <Input
                    className={
                      formErrors.recipientPhone ? "border-red-500" : ""
                    }
                    id="recipientPhone"
                    onChange={(e) =>
                      handleInputChange("recipientPhone", e.target.value)
                    }
                    placeholder="09xxxxxxxx"
                    required
                    value={formData.recipientPhone}
                  />
                  {formErrors.recipientPhone ? (
                    <p className="text-red-500 text-sm">
                      {formErrors.recipientPhone}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>縣市 *</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("city", value)}
                    value={formData.city}
                  >
                    <SelectTrigger
                      className={formErrors.city ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="選擇縣市" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(taiwanAddressData).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.city ? (
                    <p className="text-red-500 text-sm">{formErrors.city}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">區域 *</Label>
                  <Select
                    disabled={!formData.city}
                    onValueChange={(value) =>
                      handleInputChange("district", value)
                    }
                    value={formData.district}
                  >
                    <SelectTrigger
                      className={formErrors.district ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="選擇區域" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.district ? (
                    <p className="text-red-500 text-sm">
                      {formErrors.district}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">郵遞區號 *</Label>
                  <Input
                    className={formErrors.postalCode ? "border-red-500" : ""}
                    id="postalCode"
                    onChange={(e) =>
                      handleInputChange("postalCode", e.target.value)
                    }
                    placeholder="自動填入"
                    required
                    value={formData.postalCode}
                  />
                  {formErrors.postalCode ? (
                    <p className="text-red-500 text-sm">
                      {formErrors.postalCode}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="street">街道地址 *</Label>
                <Input
                  className={formErrors.street ? "border-red-500" : ""}
                  id="street"
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  placeholder="例如：中山南路1號"
                  required
                  value={formData.street}
                />
                {formErrors.street ? (
                  <p className="text-red-500 text-sm">{formErrors.street}</p>
                ) : null}
              </div>

              {/* Building Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building">大樓名稱</Label>
                  <Input
                    id="building"
                    onChange={(e) =>
                      handleInputChange("building", e.target.value)
                    }
                    placeholder="選填"
                    value={formData.building}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">樓層</Label>
                  <Input
                    id="floor"
                    onChange={(e) => handleInputChange("floor", e.target.value)}
                    placeholder="例如：3F"
                    value={formData.floor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">房號</Label>
                  <Input
                    id="room"
                    onChange={(e) => handleInputChange("room", e.target.value)}
                    placeholder="例如：A室"
                    value={formData.room}
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">配送備註</Label>
                  <Input
                    id="deliveryInstructions"
                    onChange={(e) =>
                      handleInputChange("deliveryInstructions", e.target.value)
                    }
                    placeholder="特殊配送要求"
                    value={formData.deliveryInstructions}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessCode">門禁密碼</Label>
                  <Input
                    id="accessCode"
                    onChange={(e) =>
                      handleInputChange("accessCode", e.target.value)
                    }
                    placeholder="大樓門禁或密碼"
                    value={formData.accessCode}
                  />
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center space-x-2">
                <input
                  checked={formData.isDefault}
                  id="isDefault"
                  onChange={(e) =>
                    handleInputChange("isDefault", e.target.checked)
                  }
                  type="checkbox"
                />
                <Label htmlFor="isDefault">設為預設地址</Label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  type="button"
                  variant="outline"
                >
                  取消
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存地址"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isEmpty ? (
          <div className="py-8 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">尚未新增任何地址</p>
            <p className="mt-1 text-gray-500 text-sm">
              點擊上方「新增地址」開始設置
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard
                address={address}
                key={address.id}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        open={!!deleteConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除地址</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            確定要刪除這個地址嗎？此操作無法復原。
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              onClick={() => setDeleteConfirm(null)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={confirmDelete} type="button" variant="destructive">
              刪除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
