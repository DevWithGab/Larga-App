const SOURCES = {
  short: '/logo/logo-larga-short.png',
  // White wordmark — for dark/colored backgrounds (e.g. the orange splash).
  dark: '/logo/logo-larga-for_DARK.png',
  // Black wordmark — for light backgrounds (e.g. white auth screens).
  light: '/logo/logo-larga-for_LIGHT.png',
};


const ASPECT_RATIO = 3;

export default function Logo({ variant = 'light', width = 160, className = '' }) {
  const aspectRatio = variant === 'short' ? 1 : ASPECT_RATIO;
  return (
    <img
      src={SOURCES[variant]}
      alt="Larga"
      width={width}
      height={width / aspectRatio}
      className={`object-contain ${className}`}
      style={{ width, height: width / aspectRatio }}
    />
  );
}
