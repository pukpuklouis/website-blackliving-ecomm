/**
 * AddressManager Component
 * Handles CRUD operations for customer addresses with proper error handling
 */

import React, { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  Badge,
} from '@blackliving/ui';
import { Loader2, Plus, Edit2, Trash2, Star, StarOff, MapPin } from 'lucide-react';
import { useAddresses } from '../../hooks/use-addresses';
import { validateAddress } from '../../lib/validation';
import type {
  CustomerAddress,
  AddressCreateRequest,
  AddressUpdateRequest,
} from '@blackliving/types/profile';

interface AddressManagerProps {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface AddressFormData {
  type: 'shipping' | 'billing' | 'both';
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
}

const initialFormData: AddressFormData = {
  type: 'shipping',
  label: '',
  recipientName: '',
  recipientPhone: '',
  city: '',
  district: '',
  postalCode: '',
  street: '',
  building: '',
  floor: '',
  room: '',
  deliveryInstructions: '',
  accessCode: '',
  isDefault: false,
};

const taiwanCities = [
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
  '高雄市',
  '基隆市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義縣',
  '嘉義市',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '台東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
];

export function AddressManager({ className, onSuccess, onError }: AddressManagerProps) {
  const {
    addresses,
    loading,
    error,
    isEmpty,
    defaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refresh,
  } = useAddresses();

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
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
    setFormData({
      type: address.type,
      label: address.label || '',
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      street: address.street,
      building: address.building || '',
      floor: address.floor || '',
      room: address.room || '',
      deliveryInstructions: address.deliveryInstructions || '',
      accessCode: address.accessCode || '',
      isDefault: address.isDefault,
    });
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
      const addressData: AddressCreateRequest | AddressUpdateRequest = {
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

      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.id, addressData);
      } else {
        result = await createAddress(addressData);
      }

      if (result.success) {
        setShowModal(false);
        onSuccess?.(result.message || '地址保存成功！');
      } else {
        onError?.(result.error || '保存失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失敗';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle address deletion
  const handleDelete = async (addressId: string) => {
    if (!confirm('確定要刪除這個地址嗎？')) {
      return;
    }

    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        onSuccess?.(result.message || '地址刪除成功！');
      } else {
        onError?.(result.error || '刪除失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除失敗';
      onError?.(errorMessage);
    }
  };

  // Handle setting default address
  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        onSuccess?.(result.message || '預設地址設置成功！');
      } else {
        onError?.(result.error || '設置失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '設置失敗';
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

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>收貨地址</CardTitle>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              新增地址
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? '編輯地址' : '新增地址'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Address Type */}
              <div className="space-y-2">
                <Label>地址類型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={value => handleInputChange('type', value as any)}
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
                  value={formData.label}
                  onChange={e => handleInputChange('label', e.target.value)}
                  placeholder="例如：家裡、公司"
                />
              </div>

              {/* Recipient Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">收件人姓名 *</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={e => handleInputChange('recipientName', e.target.value)}
                    className={formErrors.recipientName ? 'border-red-500' : ''}
                    required
                  />
                  {formErrors.recipientName && (
                    <p className="text-sm text-red-500">{formErrors.recipientName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">收件人電話 *</Label>
                  <Input
                    id="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={e => handleInputChange('recipientPhone', e.target.value)}
                    className={formErrors.recipientPhone ? 'border-red-500' : ''}
                    placeholder="09xxxxxxxx"
                    required
                  />
                  {formErrors.recipientPhone && (
                    <p className="text-sm text-red-500">{formErrors.recipientPhone}</p>
                  )}
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>縣市 *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={value => handleInputChange('city', value)}
                  >
                    <SelectTrigger className={formErrors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="選擇縣市" />
                    </SelectTrigger>
                    <SelectContent>
                      {taiwanCities.map(city => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">區域 *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={e => handleInputChange('district', e.target.value)}
                    className={formErrors.district ? 'border-red-500' : ''}
                    placeholder="例如：中正區"
                    required
                  />
                  {formErrors.district && (
                    <p className="text-sm text-red-500">{formErrors.district}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">郵遞區號 *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={e => handleInputChange('postalCode', e.target.value)}
                    className={formErrors.postalCode ? 'border-red-500' : ''}
                    placeholder="100"
                    required
                  />
                  {formErrors.postalCode && (
                    <p className="text-sm text-red-500">{formErrors.postalCode}</p>
                  )}
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="street">街道地址 *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={e => handleInputChange('street', e.target.value)}
                  className={formErrors.street ? 'border-red-500' : ''}
                  placeholder="例如：中山南路1號"
                  required
                />
                {formErrors.street && <p className="text-sm text-red-500">{formErrors.street}</p>}
              </div>

              {/* Building Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building">大樓名稱</Label>
                  <Input
                    id="building"
                    value={formData.building}
                    onChange={e => handleInputChange('building', e.target.value)}
                    placeholder="選填"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">樓層</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={e => handleInputChange('floor', e.target.value)}
                    placeholder="例如：3F"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">房號</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={e => handleInputChange('room', e.target.value)}
                    placeholder="例如：A室"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">配送備註</Label>
                  <Input
                    id="deliveryInstructions"
                    value={formData.deliveryInstructions}
                    onChange={e => handleInputChange('deliveryInstructions', e.target.value)}
                    placeholder="特殊配送要求"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessCode">門禁密碼</Label>
                  <Input
                    id="accessCode"
                    value={formData.accessCode}
                    onChange={e => handleInputChange('accessCode', e.target.value)}
                    placeholder="大樓門禁或密碼"
                  />
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={e => handleInputChange('isDefault', e.target.checked)}
                />
                <Label htmlFor="isDefault">設為預設地址</Label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      保存中...
                    </>
                  ) : (
                    '保存地址'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isEmpty ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">尚未新增任何地址</p>
            <p className="text-sm text-gray-500 mt-1">點擊上方「新增地址」開始設置</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(address => (
              <Card key={address.id} className="relative">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {address.label && <Badge variant="outline">{address.label}</Badge>}
                        <Badge variant={address.type === 'both' ? 'default' : 'secondary'}>
                          {address.type === 'shipping'
                            ? '收貨'
                            : address.type === 'billing'
                              ? '帳單'
                              : '收貨+帳單'}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            預設
                          </Badge>
                        )}
                      </div>

                      <p className="font-medium">{address.recipientName}</p>
                      <p className="text-sm text-gray-600">{address.recipientPhone}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {address.city}
                        {address.district}
                        {address.street}
                        {address.building && ` ${address.building}`}
                        {address.floor && ` ${address.floor}`}
                        {address.room && ` ${address.room}`}
                      </p>

                      {address.deliveryInstructions && (
                        <p className="text-xs text-gray-500 mt-1">
                          配送備註：{address.deliveryInstructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          title="設為預設"
                        >
                          <StarOff className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(address)}
                        title="編輯"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        title="刪除"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
