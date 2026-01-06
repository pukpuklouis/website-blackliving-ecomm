import { createReactBlockSpec } from "@blocknote/react";

export const ImageLinkBlock = createReactBlockSpec(
  {
    type: "imageLink",
    propSchema: {
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
    content: "none",
  },
  {
    render: ({ block }) => {
      if (!block.props.src) {
        return null;
      }

      const image = (
        <img
          alt={block.props.alt}
          className="w-full rounded-md object-contain"
          loading="lazy"
          src={block.props.src}
        />
      );

      if (block.props.link) {
        return (
          <a
            className="block w-full cursor-pointer transition-opacity hover:opacity-90"
            href={block.props.link}
            rel="noopener noreferrer"
            target="_blank"
          >
            {image}
          </a>
        );
      }

      return <div className="w-full">{image}</div>;
    },
  }
);
