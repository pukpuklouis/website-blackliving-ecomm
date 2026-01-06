import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@blackliving/ui";
import { useState } from "react";
import { z } from "zod";
import TurnstileWidget from "./auth/TurnstileWidget";

const formSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字"),
  email: z.string().email("請輸入有效的 E-mail"),
  phone: z.string().min(1, "請輸入聯絡電話"),
  subject: z.string().min(1, "請輸入主旨"),
  content: z.string().min(10, "內容至少需要 10 個字"),
  turnstileToken: z.string().min(1, "請完成驗證"),
});

type FormData = z.infer<typeof formSchema>;

export default function BusinessCooperationForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "行銷合作",
    content: "",
    turnstileToken: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user selects
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Validation
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof FormData] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/business-cooperation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "提交失敗，請稍後再試");
      }

      setSubmitSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "行銷合作",
        content: "",
        turnstileToken: "",
      });
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "提交失敗，請稍後再試"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-4 font-bold text-2xl text-gray-900">感謝您的聯繫</h3>
        <p className="mb-8 text-gray-600">
          我們已收到您的合作提案，將盡快與您聯繫。
        </p>
        <Button onClick={() => setSubmitSuccess(false)} variant="outline">
          發送新的請求
        </Button>
      </div>
    );
  }

  return (
    <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleSubmit}>
      <div className="mb-8 text-center">
        <h2 className="font-bold text-2xl text-gray-900">異業合作</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base" htmlFor="name">
            ＊姓名：
          </Label>
          <Input
            className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
            id="name"
            name="name"
            onChange={handleChange}
            placeholder=""
            value={formData.name}
          />
          {errors.name && (
            <p className="mt-1 text-md text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="text-base" htmlFor="email">
              ＊E-MAIL：
            </Label>
            <Input
              className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
              id="email"
              name="email"
              onChange={handleChange}
              type="email"
              value={formData.email}
            />
            {errors.email && (
              <p className="mt-1 text-md text-red-500">{errors.email}</p>
            )}
          </div>
          <div>
            <Label className="text-base" htmlFor="phone">
              ＊聯絡電話：
            </Label>
            <Input
              className={`mt-1 ${errors.phone ? "border-red-500" : ""}`}
              id="phone"
              name="phone"
              onChange={handleChange}
              value={formData.phone}
            />
            {errors.phone && (
              <p className="mt-1 text-md text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-base" htmlFor="subject">
            ＊合作類型：
          </Label>
          <Select
            onValueChange={(value) => handleSelectChange("subject", value)}
            value={formData.subject}
          >
            <SelectTrigger
              className={`mt-1 ${errors.subject ? "border-red-500" : ""}`}
              id="subject"
            >
              <SelectValue placeholder="選擇合作類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="行銷合作">行銷合作</SelectItem>
              <SelectItem value="經銷商合作">經銷商合作</SelectItem>
              <SelectItem value="大量採購">大量採購</SelectItem>
            </SelectContent>
          </Select>
          {errors.subject && (
            <p className="mt-1 text-md text-red-500">{errors.subject}</p>
          )}
        </div>

        <div>
          <Label className="sr-only" htmlFor="content">
            內容
          </Label>
          <Textarea
            className={`mt-1 ${errors.content ? "border-red-500" : ""}`}
            id="content"
            name="content"
            onChange={handleChange}
            placeholder="內容"
            rows={6}
            value={formData.content}
          />
          {errors.content && (
            <p className="mt-1 text-md text-red-500">{errors.content}</p>
          )}
        </div>
      </div>

      {submitError && (
        <div className="rounded-md bg-red-50 p-4 text-md text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex flex-col justify-center pt-4">
        <div className="flex justify-center">
          <TurnstileWidget
            onToken={(token) => {
              setFormData((prev) => ({ ...prev, turnstileToken: token || "" }));
              if (token) {
                setErrors((prev) => ({ ...prev, turnstileToken: undefined }));
              }
            }}
            siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
          />
        </div>
        {errors.turnstileToken && (
          <p className="mt-1 text-center text-md text-red-500">
            {errors.turnstileToken}
          </p>
        )}

        <Button
          className="mx-auto w-fit rounded-full bg-gray-900 px-24 py-2 text-white hover:bg-gray-800"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "傳送中..." : "送出"}
        </Button>
      </div>
    </form>
  );
}
