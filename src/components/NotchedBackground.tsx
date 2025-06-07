import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const NotchedBackground: React.FC = () => {
  const W = width;
  const H = 90; // 90 dp tall
  const notchDepth = 20; // Deeper notch to make it more visible
  const notchWidth = 100; // Wider notch
  const cornerRadius = 20; // 20 dp corner radius
  const Cx = W / 2; // Center X

  // Create a more visible concave notch
  const pathData = `
    M ${cornerRadius} 0
    L ${Cx - notchWidth/2} 0
    Q ${Cx - notchWidth/2 + 10} 0 ${Cx - notchWidth/2 + 15} 5
    Q ${Cx - 30} 12 ${Cx - 20} ${notchDepth}
    Q ${Cx - 10} ${notchDepth + 3} ${Cx} ${notchDepth + 3}
    Q ${Cx + 10} ${notchDepth + 3} ${Cx + 20} ${notchDepth}
    Q ${Cx + 30} 12 ${Cx + notchWidth/2 - 15} 5
    Q ${Cx + notchWidth/2 - 10} 0 ${Cx + notchWidth/2} 0
    L ${W - cornerRadius} 0
    Q ${W} 0 ${W} ${cornerRadius}
    L ${W} ${H}
    L 0 ${H}
    L 0 ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    Z
  `;

  return (
    <Svg 
      style={styles.svg} 
      width={W} 
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      <Path 
        d={pathData} 
        fill="#003C46"
        fillRule="evenodd"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default NotchedBackground; 