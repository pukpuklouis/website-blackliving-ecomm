import type { BlockNoteEditor } from "@blocknote/core";
import { createBlockSpec, defaultProps } from "@blocknote/core";
import type { MediaLibraryItem } from "../../../services/mediaLibrary";

type ExtendedBlockNoteEditor = BlockNoteEditor & {
  openMediaPicker: (
    category: "images" | "files",
    blockId?: string
  ) => Promise<MediaLibraryItem | undefined>;
};

export const ImageLinkBlock = createBlockSpec(
  {
    type: "imageLink",
    propSchema: {
      ...defaultProps,
      src: {
        default: "",
      },
      link: {
        default: "",
      },
      alt: {
        default: "",
      },
      width: {
        default: 512,
      },
    },
    content: "none" as const,
  },
  {
    // DOM-based render to avoid ReactNodeViewRenderer position tracking issues
    render: (block, editor) => {
      const wrapper = document.createElement("div");
      wrapper.className = "bn-image-link-wrapper";
      wrapper.style.position = "relative";
      wrapper.style.padding = "8px";
      wrapper.style.border = "1px solid #e5e7eb";
      wrapper.style.borderRadius = "8px";
      wrapper.style.backgroundColor = "#fff";
      wrapper.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";

      if (!block.props.src) {
        // Empty state - show button to select image
        const placeholder = document.createElement("div");
        placeholder.className = "bn-image-placeholder";
        placeholder.style.display = "flex";
        placeholder.style.alignItems = "center";
        placeholder.style.justifyContent = "center";
        placeholder.style.padding = "32px";
        placeholder.style.border = "2px dashed #d1d5db";
        placeholder.style.borderRadius = "8px";
        placeholder.style.backgroundColor = "#f9fafb";
        placeholder.style.cursor = "pointer";

        const btn = document.createElement("button");
        btn.textContent = "選擇圖片";
        btn.style.padding = "8px 16px";
        btn.style.borderRadius = "6px";
        btn.style.border = "1px solid #d1d5db";
        btn.style.backgroundColor = "#fff";
        btn.style.cursor = "pointer";
        btn.onclick = async () => {
          const openPicker = (editor as unknown as ExtendedBlockNoteEditor)
            .openMediaPicker;
          if (openPicker) {
            const item = await openPicker("images");
            if (item) {
              editor.updateBlock(block, {
                props: { ...block.props, src: item.url, alt: item.name },
              });
            }
          }
        };

        placeholder.appendChild(btn);
        wrapper.appendChild(placeholder);
        return { dom: wrapper };
      }

      // Image container
      const imgContainer = document.createElement("div");
      imgContainer.style.position = "relative";
      imgContainer.style.overflow = "hidden";
      imgContainer.style.borderRadius = "6px";
      imgContainer.style.backgroundColor = "#f3f4f6";

      const img = document.createElement("img");
      img.src = block.props.src;
      img.alt = block.props.alt || "";
      img.style.width = "100%";
      img.style.objectFit = "contain";
      img.style.maxHeight = "400px";
      img.contentEditable = "false";
      img.draggable = false;

      imgContainer.appendChild(img);

      // Link input container
      const linkContainer = document.createElement("div");
      linkContainer.style.display = "flex";
      linkContainer.style.alignItems = "center";
      linkContainer.style.gap = "8px";
      linkContainer.style.marginTop = "8px";
      linkContainer.style.padding = "8px";

      const linkIcon = document.createElement("span");
      linkIcon.textContent = "🔗";
      linkIcon.style.color = "#9ca3af";

      const linkInput = document.createElement("input");
      linkInput.type = "text";
      linkInput.placeholder = "輸入連結網址 (https://...)";
      linkInput.value = block.props.link || "";
      linkInput.style.flex = "1";
      linkInput.style.padding = "6px 12px";
      linkInput.style.borderRadius = "6px";
      linkInput.style.border = "1px solid #d1d5db";
      linkInput.style.fontSize = "14px";

      // Prevent editor from intercepting keyboard events
      linkInput.onkeydown = (e) => e.stopPropagation();
      linkInput.onkeyup = (e) => e.stopPropagation();
      linkInput.onkeypress = (e) => e.stopPropagation();

      linkInput.onchange = (e) => {
        const newLink = (e.target as HTMLInputElement).value;
        editor.updateBlock(block, {
          props: { ...block.props, link: newLink },
        });
      };

      linkContainer.appendChild(linkIcon);
      linkContainer.appendChild(linkInput);

      if (block.props.link) {
        const externalLink = document.createElement("a");
        externalLink.href = block.props.link;
        externalLink.target = "_blank";
        externalLink.rel = "noopener noreferrer";
        externalLink.textContent = "↗";
        externalLink.style.color = "#3b82f6";
        externalLink.style.textDecoration = "none";
        externalLink.style.fontSize = "16px";
        linkContainer.appendChild(externalLink);
      }

      wrapper.appendChild(imgContainer);
      wrapper.appendChild(linkContainer);

      return { dom: wrapper };
    },
    toExternalHTML: (block) => {
      if (!block.props.src) {
        const div = document.createElement("div");
        return { dom: div };
      }

      const wrapper = document.createElement("div");
      const img = document.createElement("img");
      img.src = block.props.src;
      img.alt = block.props.alt || "";
      img.style.width = "100%";
      img.style.objectFit = "contain";

      if (block.props.link) {
        const link = document.createElement("a");
        link.href = block.props.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.appendChild(img);
        wrapper.appendChild(link);
      } else {
        wrapper.appendChild(img);
      }

      return { dom: wrapper };
    },
  }
);
