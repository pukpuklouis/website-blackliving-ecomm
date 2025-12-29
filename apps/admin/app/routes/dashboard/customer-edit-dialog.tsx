import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@blackliving/ui";
import Calendar from "@lucide/react/calendar";
import ChevronRight from "@lucide/react/chevron-right";
import FileText from "@lucide/react/file-text";
import Loader2 from "@lucide/react/loader-2";
import Mail from "@lucide/react/mail";
import MapPin from "@lucide/react/map-pin";
import Phone from "@lucide/react/phone";
import Plus from "@lucide/react/plus";
import Save from "@lucide/react/save";
import Settings from "@lucide/react/settings";
import Tag from "@lucide/react/tag";
import Trash2 from "@lucide/react/trash-2";
import User from "@lucide/react/user";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiUrl } from "../../contexts/EnvironmentContext";
import {
  type CustomerAddress,
  type CustomerInteraction,
  type CustomerProfile,
  type CustomerTag,
  churnRiskLabels,
  contactPreferenceLabels,
  genderLabels,
  type InteractionType,
  interactionTypeLabels,
  interactionTypes,
  segmentLabels,
} from "./customer-types";
import { TagAutocomplete } from "./tag-autocomplete";
import { TagManagementSheet } from "./tag-management-sheet";

type CustomerEditDialogProps = {
  customer: CustomerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  initialTab?: string;
};

type AllTags = CustomerTag[];

export function CustomerEditDialog({
  customer,
  open,
  onOpenChange,
  onSave,
  initialTab = "basic",
}: CustomerEditDialogProps) {
  const apiUrl = useApiUrl();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [notes, setNotes] = useState("");
  const [contactPreference, setContactPreference] = useState<
    "email" | "phone" | "sms"
  >("email");
  const [segment, setSegment] = useState<
    "new" | "regular" | "vip" | "inactive"
  >("new");
  const [churnRisk, setChurnRisk] = useState<"low" | "medium" | "high">("low");

  // Address state
  const [address, setAddress] = useState<CustomerAddress | null>(null);
  const [shippingAddresses, setShippingAddresses] = useState<CustomerAddress[]>(
    []
  );

  // Tags state
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [allTags, setAllTags] = useState<AllTags>([]);
  const [tagManagementOpen, setTagManagementOpen] = useState(false);

  // Interactions state
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [newInteractionType, setNewInteractionType] =
    useState<InteractionType>("note");
  const [newInteractionTitle, setNewInteractionTitle] = useState("");
  const [newInteractionDescription, setNewInteractionDescription] =
    useState("");
  const [editingInteractionId, setEditingInteractionId] = useState<
    string | null
  >(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load customer data when dialog opens
  useEffect(() => {
    if (customer && open) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setBirthday(customer.birthday ?? "");
      setGender(customer.gender ?? "");
      setNotes(customer.notes ?? "");
      setContactPreference(customer.contactPreference ?? "email");
      setSegment(customer.segment);
      setChurnRisk(customer.churnRisk);
      setAddress(customer.address ?? null);
      setShippingAddresses(customer.shippingAddresses ?? []);
      setTags(customer.tags ?? []);
      setActiveTab(initialTab);
    }
  }, [customer, open, initialTab]);

  // Load all available tags
  const loadAllTags = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/customers/tags`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAllTags(result.data.tags);
        }
      }
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  }, [apiUrl]);

  const loadInteractions = useCallback(async () => {
    if (!customer) {
      return;
    }
    try {
      const response = await fetch(
        `${apiUrl}/api/customers/${customer.id}/interactions`,
        { credentials: "include" }
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setInteractions(result.data.interactions);
        }
      }
    } catch (error) {
      console.error("Failed to load interactions:", error);
    }
  }, [apiUrl, customer]);

  useEffect(() => {
    if (open) {
      loadAllTags();
      loadInteractions();
    }
  }, [open, loadAllTags, loadInteractions]);

  const handleSaveBasicInfo = async () => {
    if (!customer) {
      return;
    }
    setSaving(true);
    try {
      // Filter out empty shipping addresses
      const validShippingAddresses = shippingAddresses.filter(
        (addr) => addr.city || addr.district || addr.street || addr.postalCode
      );

      // Only include address if it has any values
      const hasAddress =
        address &&
        (address.city ||
          address.district ||
          address.street ||
          address.postalCode);

      const response = await fetch(`${apiUrl}/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone,
          birthday: birthday || undefined,
          gender: gender || undefined,
          notes,
          contactPreference,
          segment,
          churnRisk,
          address: hasAddress ? address : null,
          shippingAddresses: validShippingAddresses,
        }),
      });
      if (response.ok) {
        toast.success("客戶資料已更新");
        onSave();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update failed:", errorData);
        toast.error("更新失敗");
      }
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast.error("更新失敗");
    } finally {
      setSaving(false);
    }
  };

  // Address management
  const handleAddShippingAddress = () => {
    setShippingAddresses([
      ...shippingAddresses,
      { city: "", district: "", street: "", postalCode: "" },
    ]);
  };

  const handleUpdateShippingAddress = (
    index: number,
    field: keyof CustomerAddress,
    value: string
  ) => {
    const updated = [...shippingAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setShippingAddresses(updated);
  };

  const handleRemoveShippingAddress = (index: number) => {
    setShippingAddresses(shippingAddresses.filter((_, i) => i !== index));
  };

  const handleAssignTag = async (tagId: string) => {
    if (!customer) {
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/customers/tags/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerProfileId: customer.id,
          customerTagId: tagId,
        }),
      });
      if (response.ok) {
        const tagToAdd = allTags.find((t) => t.id === tagId);
        if (tagToAdd) {
          setTags([...tags, tagToAdd]);
        }
        toast.success("標籤已新增");
      }
    } catch (error) {
      console.error("Failed to assign tag:", error);
      toast.error("新增標籤失敗");
    }
  };
  const handleRemoveTag = async (tagId: string) => {
    if (!customer) {
      return;
    }
    try {
      const response = await fetch(
        `${apiUrl}/api/customers/tags/assign/${customer.id}/${tagId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.ok) {
        setTags(tags.filter((t) => t.id !== tagId));
        toast.success("標籤已移除");
      }
    } catch (error) {
      console.error("Failed to remove tag:", error);
      toast.error("移除標籤失敗");
    }
  };
  // Handler for creating a new tag (called from TagAutocomplete or TagManagementSheet)
  const handleCreateTagAndAssign = async (
    tagName: string,
    tagColor: string
  ) => {
    if (!customer) {
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/customers/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: tagName,
          color: tagColor,
          category: "custom",
        }),
      });
      if (response.ok) {
        const result = await response.json();
        toast.success("標籤已建立");
        await loadAllTags();
        // Auto-assign the new tag to the customer
        if (result.data?.tag?.id) {
          await handleAssignTag(result.data.tag.id);
        }
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("建立標籤失敗");
    }
  };

  // Handler for creating a new tag (from TagManagementSheet, no auto-assign)
  const handleCreateTag = async (tagName: string, tagColor: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/customers/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: tagName,
          color: tagColor,
          category: "custom",
        }),
      });
      if (response.ok) {
        toast.success("標籤已建立");
        await loadAllTags();
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("建立標籤失敗");
    }
  };

  // Handler for updating a tag (from TagManagementSheet)
  const handleUpdateTag = async (
    tagId: string,
    tagName: string,
    tagColor: string
  ) => {
    try {
      const response = await fetch(`${apiUrl}/api/customers/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: tagName, color: tagColor }),
      });
      if (response.ok) {
        toast.success("標籤已更新");
        await loadAllTags();
        // Update local tags state if this tag is assigned to customer
        setTags(
          tags.map((t) =>
            t.id === tagId ? { ...t, name: tagName, color: tagColor } : t
          )
        );
      } else {
        toast.error("更新標籤失敗");
      }
    } catch (error) {
      console.error("Failed to update tag:", error);
      toast.error("更新標籤失敗");
    }
  };

  // Handler for deleting a tag (from TagManagementSheet)
  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/customers/tags/${tagId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("標籤已刪除");
        await loadAllTags();
        // Remove from local tags if assigned to customer
        setTags(tags.filter((t) => t.id !== tagId));
      } else {
        toast.error("刪除標籤失敗");
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("刪除標籤失敗");
    }
  };

  const handleAddInteraction = async () => {
    if (!(customer && newInteractionTitle.trim())) {
      return;
    }
    try {
      const response = await fetch(
        `${apiUrl}/api/customers/${customer.id}/interactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type: newInteractionType,
            title: newInteractionTitle,
            description: newInteractionDescription,
          }),
        }
      );
      if (response.ok) {
        toast.success("互動記錄已新增");
        setNewInteractionTitle("");
        setNewInteractionDescription("");
        loadInteractions();
      }
    } catch (error) {
      console.error("Failed to add interaction:", error);
      toast.error("新增互動記錄失敗");
    }
  };

  const handleUpdateInteraction = async (
    interactionId: string,
    updates: { type?: string; title?: string; description?: string }
  ) => {
    if (!customer) {
      return;
    }
    try {
      const response = await fetch(
        `${apiUrl}/api/customers/${customer.id}/interactions/${interactionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        }
      );
      if (response.ok) {
        toast.success("互動記錄已更新");
        setEditingInteractionId(null);
        loadInteractions();
      }
    } catch (error) {
      console.error("Failed to update interaction:", error);
      toast.error("更新互動記錄失敗");
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!customer) {
      return;
    }
    try {
      const response = await fetch(
        `${apiUrl}/api/customers/${customer.id}/interactions/${interactionId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.ok) {
        toast.success("互動記錄已刪除");
        setDeleteConfirmId(null);
        loadInteractions();
      }
    } catch (error) {
      console.error("Failed to delete interaction:", error);
      toast.error("刪除互動記錄失敗");
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            編輯客戶資料 - {customer.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">
              <User className="mr-1 h-4 w-4" />
              基本資料
            </TabsTrigger>
            <TabsTrigger value="address">
              <MapPin className="mr-1 h-4 w-4" />
              地址
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tag className="mr-1 h-4 w-4" />
              標籤
            </TabsTrigger>
            <TabsTrigger value="interactions">
              <FileText className="mr-1 h-4 w-4" />
              互動記錄
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-1 h-4 w-4" />
              分級設定
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent className="mt-4 space-y-4" value="basic">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="客戶姓名"
                  value={name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件 *</Label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    value={email}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話 *</Label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    id="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912-345-678"
                    value={phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">生日</Label>
                <div className="relative">
                  <Calendar className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    id="birthday"
                    onChange={(e) => setBirthday(e.target.value)}
                    type="date"
                    value={birthday}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <Select
                  onValueChange={(v) =>
                    setGender(v as "male" | "female" | "other")
                  }
                  value={gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇性別" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(genderLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPreference">偏好聯繫方式</Label>
                <Select
                  onValueChange={(v) =>
                    setContactPreference(v as "email" | "phone" | "sms")
                  }
                  value={contactPreference}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇聯繫方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(contactPreferenceLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="客戶備註..."
                rows={4}
                value={notes}
              />
            </div>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent className="mt-4 space-y-6" value="address">
            {/* Primary Address */}
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-4 font-medium">主要地址</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>城市</Label>
                    <Input
                      onChange={(e) =>
                        setAddress({
                          city: e.target.value,
                          district: address?.district ?? "",
                          street: address?.street ?? "",
                          postalCode: address?.postalCode ?? "",
                        })
                      }
                      placeholder="台北市"
                      value={address?.city ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>區域</Label>
                    <Input
                      onChange={(e) =>
                        setAddress({
                          city: address?.city ?? "",
                          district: e.target.value,
                          street: address?.street ?? "",
                          postalCode: address?.postalCode ?? "",
                        })
                      }
                      placeholder="大安區"
                      value={address?.district ?? ""}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>街道地址</Label>
                    <Input
                      onChange={(e) =>
                        setAddress({
                          city: address?.city ?? "",
                          district: address?.district ?? "",
                          street: e.target.value,
                          postalCode: address?.postalCode ?? "",
                        })
                      }
                      placeholder="忠孝東路123號"
                      value={address?.street ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>郵遞區號</Label>
                    <Input
                      onChange={(e) =>
                        setAddress({
                          city: address?.city ?? "",
                          district: address?.district ?? "",
                          street: address?.street ?? "",
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="106"
                      value={address?.postalCode ?? ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Addresses */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-medium">寄送地址</h4>
                <Button
                  onClick={handleAddShippingAddress}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  新增地址
                </Button>
              </div>
              <div className="space-y-4">
                {shippingAddresses.map((addr, index) => (
                  <Card key={`shipping-${index.toString()}`}>
                    <CardContent className="relative p-4">
                      <Button
                        className="absolute top-2 right-2 h-8 w-8 text-red-500"
                        onClick={() => handleRemoveShippingAddress(index)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>城市</Label>
                          <Input
                            onChange={(e) =>
                              handleUpdateShippingAddress(
                                index,
                                "city",
                                e.target.value
                              )
                            }
                            placeholder="台北市"
                            value={addr.city}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>區域</Label>
                          <Input
                            onChange={(e) =>
                              handleUpdateShippingAddress(
                                index,
                                "district",
                                e.target.value
                              )
                            }
                            placeholder="大安區"
                            value={addr.district}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>街道地址</Label>
                          <Input
                            onChange={(e) =>
                              handleUpdateShippingAddress(
                                index,
                                "street",
                                e.target.value
                              )
                            }
                            placeholder="忠孝東路123號"
                            value={addr.street}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>郵遞區號</Label>
                          <Input
                            onChange={(e) =>
                              handleUpdateShippingAddress(
                                index,
                                "postalCode",
                                e.target.value
                              )
                            }
                            placeholder="106"
                            value={addr.postalCode}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {shippingAddresses.length === 0 && (
                  <p className="py-8 text-center text-gray-500">
                    尚未新增寄送地址
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent className="mt-4 space-y-6" value="tags">
            {/* Tag Autocomplete Component */}
            <TagAutocomplete
              allTags={allTags}
              assignedTags={tags}
              onAssignTag={handleAssignTag}
              onCreateTag={handleCreateTagAndAssign}
              onRemoveTag={handleRemoveTag}
            />

            {/* Manage All Tags Link */}
            <button
              className="flex items-center gap-1 text-gray-600 text-sm hover:text-gray-900"
              onClick={() => setTagManagementOpen(true)}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
              管理所有標籤
            </button>

            {/* Tag Management Sheet */}
            <TagManagementSheet
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
              onOpenChange={setTagManagementOpen}
              onRefresh={loadAllTags}
              onUpdateTag={handleUpdateTag}
              open={tagManagementOpen}
              tags={allTags}
            />
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent className="mt-4 space-y-6" value="interactions">
            {/* Add New Interaction */}
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-4 font-medium">新增互動記錄</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>類型</Label>
                      <Select
                        onValueChange={(v) =>
                          setNewInteractionType(v as InteractionType)
                        }
                        value={newInteractionType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interactionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {interactionTypeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>標題 *</Label>
                      <Input
                        onChange={(e) => setNewInteractionTitle(e.target.value)}
                        placeholder="互動標題"
                        value={newInteractionTitle}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea
                      onChange={(e) =>
                        setNewInteractionDescription(e.target.value)
                      }
                      placeholder="互動內容描述..."
                      rows={3}
                      value={newInteractionDescription}
                    />
                  </div>
                  <Button
                    disabled={!newInteractionTitle.trim()}
                    onClick={handleAddInteraction}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    新增記錄
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interaction List */}
            <div>
              <h4 className="mb-4 font-medium">互動歷史</h4>
              <div className="space-y-3">
                {interactions.length > 0 ? (
                  interactions.map((interaction) => (
                    <InteractionItem
                      deleteConfirmId={deleteConfirmId}
                      interaction={interaction}
                      isEditing={editingInteractionId === interaction.id}
                      key={interaction.id}
                      onCancelDelete={() => setDeleteConfirmId(null)}
                      onCancelEdit={() => setEditingInteractionId(null)}
                      onConfirmDelete={() =>
                        handleDeleteInteraction(interaction.id)
                      }
                      onEdit={() => setEditingInteractionId(interaction.id)}
                      onRequestDelete={() => setDeleteConfirmId(interaction.id)}
                      onUpdate={(updates) =>
                        handleUpdateInteraction(interaction.id, updates)
                      }
                    />
                  ))
                ) : (
                  <p className="py-8 text-center text-gray-500">尚無互動記錄</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent className="mt-4 space-y-4" value="settings">
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-4 font-medium">客戶分級設定</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>客戶分級</Label>
                    <Select
                      onValueChange={(v) =>
                        setSegment(v as "new" | "regular" | "vip" | "inactive")
                      }
                      value={segment}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(segmentLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>流失風險</Label>
                    <Select
                      onValueChange={(v) =>
                        setChurnRisk(v as "low" | "medium" | "high")
                      }
                      value={churnRisk}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(churnRiskLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            取消
          </Button>
          <Button disabled={saving} onClick={handleSaveBasicInfo}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                儲存變更
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Interaction Item Component
type InteractionItemProps = {
  interaction: CustomerInteraction;
  isEditing: boolean;
  deleteConfirmId: string | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (updates: {
    type?: string;
    title?: string;
    description?: string;
  }) => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

function InteractionItem({
  interaction,
  isEditing,
  deleteConfirmId,
  onEdit,
  onCancelEdit,
  onUpdate,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: InteractionItemProps) {
  const [editType, setEditType] = useState(interaction.type);
  const [editTitle, setEditTitle] = useState(interaction.title);
  const [editDescription, setEditDescription] = useState(
    interaction.description ?? ""
  );

  const isConfirmingDelete = deleteConfirmId === interaction.id;

  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>類型</Label>
                <Select onValueChange={(v) => setEditType(v)} value={editType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {interactionTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>標題</Label>
                <Input
                  onChange={(e) => setEditTitle(e.target.value)}
                  value={editTitle}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                value={editDescription}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={onCancelEdit} size="sm" variant="outline">
                取消
              </Button>
              <Button
                onClick={() =>
                  onUpdate({
                    type: editType,
                    title: editTitle,
                    description: editDescription,
                  })
                }
                size="sm"
              >
                儲存
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const typeLabel =
    interactionTypeLabels[interaction.type as InteractionType] ??
    interaction.type;

  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabel}</Badge>
            <span className="font-medium">{interaction.title}</span>
          </div>
          {interaction.description ? (
            <p className="mt-1 text-gray-600 text-sm">
              {interaction.description}
            </p>
          ) : null}
          <p className="mt-2 text-gray-400 text-xs">
            {new Date(interaction.createdAt).toLocaleDateString("zh-TW")}
            {interaction.performedBy ? ` • ${interaction.performedBy}` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          {isConfirmingDelete ? (
            <>
              <Button
                className="text-red-600"
                onClick={onConfirmDelete}
                size="sm"
                variant="outline"
              >
                確認刪除
              </Button>
              <Button onClick={onCancelDelete} size="sm" variant="ghost">
                取消
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onEdit} size="icon" variant="ghost">
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                className="text-red-500"
                onClick={onRequestDelete}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
