import {
  DragHandleButton,
  SideMenu,
  type SideMenuProps,
  useComponentsContext,
} from "@blocknote/react";
import ImageIcon from "@lucide/react/image";
import PaperclipIcon from "@lucide/react/paperclip";
import { useCallback, useState } from "react";
import type { MediaLibraryItem } from "../../services/mediaLibrary";

export type MediaSideMenuProps = SideMenuProps & {
  onLaunchPicker: (
    category: "images" | "files",
    blockId?: string
  ) => Promise<MediaLibraryItem | undefined>;
  block?: { id?: string };
  freezeMenu?: () => void;
  unfreezeMenu?: () => void;
  enabledFeatures?: {
    images?: boolean;
    files?: boolean;
  };
};

type MediaButtonConfig = {
  key: "images" | "files";
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
};

export function MediaSideMenu(props: MediaSideMenuProps) {
  const {
    onLaunchPicker,
    block,
    freezeMenu,
    unfreezeMenu,
    enabledFeatures = { images: true, files: false },
  } = props;
  const Components = useComponentsContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(
    async (category: "images" | "files") => {
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        freezeMenu?.();
        await onLaunchPicker(category, block?.id);
      } catch (error) {
        console.error(`Failed to launch ${category} picker:`, error);
        // TODO: Consider adding user notification here if a toast system is available
      } finally {
        unfreezeMenu?.();
        setIsLoading(false);
      }
    },
    [block?.id, freezeMenu, onLaunchPicker, unfreezeMenu, isLoading]
  );

  const buttonConfigs: MediaButtonConfig[] = [
    {
      key: "images",
      label: "從媒體庫插入圖片",
      icon: <ImageIcon className="h-4 w-4" />,
      enabled: enabledFeatures.images ?? true,
    },
    {
      key: "files",
      label: "從媒體庫插入檔案",
      icon: <PaperclipIcon className="h-4 w-4" />,
      enabled: enabledFeatures.files ?? false,
    },
  ];

  if (!Components) {
    return <SideMenu {...props} />;
  }

  return (
    <SideMenu {...props}>
      {buttonConfigs
        .filter((config) => config.enabled)
        .map((config) => (
          <Components.SideMenu.Button
            className="bn-button"
            icon={config.icon}
            key={config.key}
            label={config.label}
            onClick={() => handleClick(config.key)}
          />
        ))}
      <DragHandleButton {...props} />
    </SideMenu>
  );
}
