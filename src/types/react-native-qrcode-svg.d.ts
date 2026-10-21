declare module 'react-native-qrcode-svg' {
  import { ViewProps } from 'react-native';

  interface QRCodeProps extends ViewProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: string;
    logoSize?: number;
    logoMargin?: number;
    logoBackgroundColor?: string;
    logoBorderRadius?: number;
    quietZone?: number;
  }

  export default class QRCode extends React.Component<QRCodeProps> {}
}
