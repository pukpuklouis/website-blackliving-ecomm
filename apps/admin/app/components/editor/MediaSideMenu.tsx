import {
  DragHandleButton,
  SideMenu,
  type SideMenuProps,
  useComponentsContext,
} from "@blocknote/react";
import ImageIcon from "@lucide/react/image";
import { useCallback } from "react";
import type { MediaLibraryItem } from "../../services/mediaLibrary";

export type MediaSideMenuProps = SideMenuProps & {
  onLaunchPicker: (
    category: "images" | "files",
    blockId?: string
  ) => Promise<MediaLibraryItem | undefined>;
  block?: { id: string };
  freezeMenu?: () => void;
  unfreezeMenu?: () => void;
};

export function MediaSideMenu(props: MediaSideMenuProps) {
  const { onLaunchPicker, block, freezeMenu, unfreezeMenu } = props;
  const Components = useComponentsContext();

  const handleClick = useCallback(
    (category: "images" | "files") => {
      const execute = async () => {
        try {
          freezeMenu?.();
          await onLaunchPicker(category, block?.id);
        } finally {
          unfreezeMenu?.();
        }
      };

      execute();
    },
    [block?.id, freezeMenu, onLaunchPicker, unfreezeMenu]
  );

  return (
    <SideMenu {...props}>
      {/*<AddBlockButton {...props} />*/}
      {Components ? (
        <Components.SideMenu.Button
          className="bn-button"
          icon={<ImageIcon className="h-4 w-4" />}
          label="從媒體庫插入圖片"
          onClick={() => handleClick("images")}
        />
      ) : null}
      <DragHandleButton {...props} />
    </SideMenu>
  );
}
