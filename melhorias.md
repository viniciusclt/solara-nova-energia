interface ResponsiveTextProps {
  children: React.ReactNode;
  maxWidth?: string;
  breakLines?: boolean;
  hideOnSmall?: boolean;
  showTooltipOnTruncate?: boolean;
  responsiveStrategy?: 'wrap' | 'hide' | 'truncate';
}