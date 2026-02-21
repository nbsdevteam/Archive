import { img_path } from "../../../environment";

/** Props for the image component (avoids conflict with global Image type). */
export interface ImageWithBasePathProps {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?: string;
  role?: string;
}

const ImageWithBasePath = (props: ImageWithBasePathProps) => {
  const fullSrc = `${img_path}${props.src}`;
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
      role={props.role}
    />
  );
};

export default ImageWithBasePath;
