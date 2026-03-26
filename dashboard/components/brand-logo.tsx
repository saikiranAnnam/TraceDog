import Image from "next/image";

export function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/icons/TraceDogAppleIcon.png"
      alt="TraceDog"
      width={size}
      height={size}
      className="brand-logo-img"
      priority
    />
  );
}
