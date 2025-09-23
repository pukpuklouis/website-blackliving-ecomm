import { useCallback } from 'react';
import {
  SideMenu,
  type SideMenuProps,
  AddBlockButton,
  DragHandleButton,
  useComponentsContext,
} from '@blocknote/react';
import ImageIcon from '@lucide/react/image';
import PaperclipIcon from '@lucide/react/paperclip';

export type MediaSideMenuProps = SideMenuProps & {
  onLaunchPicker: (category: 'images' | 'files', blockId?: string) => Promise<void>;
};

export function MediaSideMenu(props: MediaSideMenuProps) {
  const { onLaunchPicker, block, freezeMenu, unfreezeMenu } = props;
  const Components = useComponentsContext();

  const handleClick = useCallback(
    (category: 'images' | 'files') => {
      const execute = async () => {
        try {
          freezeMenu?.();
          await onLaunchPicker(category, block?.id);
        } finally {
          unfreezeMenu?.();
        }
      };

      void execute();
    },
    [block?.id, freezeMenu, onLaunchPicker, unfreezeMenu]
  );

  return (
    <SideMenu {...props}>
      {/*<AddBlockButton {...props} />*/}
      {Components ? (
        <>
          <Components.SideMenu.Button
            className="bn-button"
            label="從媒體庫插入圖片"
            onClick={() => handleClick('images')}
            icon={<ImageIcon className="h-4 w-4" />}
          />
          {/*<Components.SideMenu.Button
            className="bn-button"
            label="從媒體庫插入檔案"
            onClick={() => handleClick('files')}
            icon={<PaperclipIcon className="h-4 w-4" />}
          />*/}
        </>
      ) : null}
      <DragHandleButton {...props} />
    </SideMenu>
  );
}
