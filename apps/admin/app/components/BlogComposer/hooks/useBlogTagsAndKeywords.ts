import { useState } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormGetValues,
  UseFormSetValue,
} from "react-hook-form";

export function useBlogTagsAndKeywords<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  getValues: UseFormGetValues<T>
) {
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const addTag = () => {
    const newTag = tagInput.trim();
    const currentTags = (getValues("tags" as Path<T>) as string[]) ?? [];
    if (newTag && !currentTags.includes(newTag)) {
      setValue(
        "tags" as Path<T>,
        [...currentTags, newTag] as PathValue<T, Path<T>>,
        {
          shouldDirty: true,
        }
      );
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = (getValues("tags" as Path<T>) as string[]) ?? [];
    setValue(
      "tags" as Path<T>,
      currentTags.filter((tag: string) => tag !== tagToRemove) as PathValue<
        T,
        Path<T>
      >,
      { shouldDirty: true }
    );
  };

  const addKeyword = () => {
    const newKeyword = keywordInput.trim();
    const currentKeywords =
      (getValues("seoKeywords" as Path<T>) as string[]) ?? [];
    if (newKeyword && !currentKeywords.includes(newKeyword)) {
      setValue(
        "seoKeywords" as Path<T>,
        [...currentKeywords, newKeyword] as PathValue<T, Path<T>>,
        {
          shouldDirty: true,
        }
      );
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords =
      (getValues("seoKeywords" as Path<T>) as string[]) ?? [];
    setValue(
      "seoKeywords" as Path<T>,
      currentKeywords.filter(
        (kw: string) => kw !== keywordToRemove
      ) as PathValue<T, Path<T>>,
      { shouldDirty: true }
    );
  };

  return {
    tagInput,
    setTagInput,
    keywordInput,
    setKeywordInput,
    addTag,
    removeTag,
    addKeyword,
    removeKeyword,
  };
}
