import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import type { BlogPostFormData, Category } from "../schema";
import {
  attemptAuthRetry,
  getErrorMessage,
  preparePayload,
} from "../utils/formSubmitUtils";

type UseBlogSubmitOptions = {
  apiUrl: string;
  postId: string | null;
  isEditing: boolean;
  categories: Category[];
  navigate: (path: string) => void;
};

export function useBlogSubmit(options: UseBlogSubmitOptions) {
  const { apiUrl, postId, isEditing, categories, navigate } = options;
  const [saving, setSaving] = useState(false);

  const buildRequestUrl = () =>
    isEditing ? `${apiUrl}/api/posts/${postId}` : `${apiUrl}/api/posts`;

  const buildRequestConfig = (payload: unknown) => ({
    method: isEditing ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include" as const,
    body: JSON.stringify(payload),
  });

  const makeRequest = async (url: string, config: RequestInit) => {
    let response = await fetch(url, config);

    if (response.status === 401 || response.status === 403) {
      await attemptAuthRetry(apiUrl);
      response = await fetch(url, config);
    }

    return response;
  };

  const handleResponse = async (response: Response) => {
    if (!response.ok) {
      const errorMessage = getErrorMessage(
        response.status,
        response.statusText
      );
      toast.error(errorMessage);
      throw new Error(
        `Failed to save post: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  };

  const handleSuccess = (payload: BlogPostFormData) => {
    const effectiveStatus =
      payload.status || (isEditing ? "published" : "draft");
    const statusText =
      effectiveStatus === "published" ? "文章已發布" : "草稿已儲存";

    const successMessage = isEditing
      ? `文章已成功更新！${payload.status === "published" ? " 並已發布" : ""}`
      : statusText;

    toast.success(successMessage);

    setTimeout(() => {
      navigate("/dashboard/posts");
    }, 1000);
  };

  const onSubmit: SubmitHandler<BlogPostFormData> = async (data) => {
    toast.info(isEditing ? "正在更新文章..." : "正在儲存文章...");

    try {
      setSaving(true);

      const url = buildRequestUrl();
      const payload = preparePayload(data, categories) as BlogPostFormData;
      const config = buildRequestConfig(payload);

      const response = await makeRequest(url, config);
      const result = await handleResponse(response);

      if (result.success) {
        handleSuccess(payload);
      } else {
        toast.error(result.error || "儲存失敗，請重試");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("儲存文章失敗");
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    onSubmit,
  };
}
