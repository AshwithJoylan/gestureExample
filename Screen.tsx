import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

interface Props {
  items: string[];
}

export const Screen = (props: Props) => {
  const [itemsToRender, setItemsToRender] = useState<string[]>(
    props.items.slice(0, 3)
  );

  // Layout stuff, gets copied from the LayoutHelper.getStyles style object
  const size = useWindowDimensions();
  const windowHeight = size.height;
  const isPanning = useSharedValue(false);
  const activeIndex = useSharedValue(0);
  const posY = useSharedValue(0);
  const scondPosY = useSharedValue(0);
  const thirdPosY = useSharedValue(-windowHeight / 2);

  const renderNextItems = useCallback((value: number) => {
    posY.value = 0;
    scondPosY.value = 0;
    thirdPosY.value = -windowHeight / 2;
    setItemsToRender(props.items.slice(value, value + 3));
  }, []);

  const handler = Gesture.Pan()
    .onStart(() => {
      isPanning.value = true;
    })
    .onChange((event) => {
      posY.value = event.translationY;
    })
    .onEnd(() => {
      isPanning.value = false;
      if (posY.value > 50) {
        posY.value = withTiming(windowHeight);
        scondPosY.value = withTiming(windowHeight / 2);
        activeIndex.value += 1;
        thirdPosY.value = withTiming(0, {}, (finished) => {
          if (finished) {
            runOnJS(renderNextItems)(activeIndex.value);
          }
        });
      } else {
        posY.value = withTiming(0);
      }
    });

  const currentItemTransform = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: windowHeight / 2 + posY.value,
        },
      ],
    }),
    [itemsToRender.join(", ")]
  );

  const nextItemTransform = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: scondPosY.value,
        },
      ],
    }),
    [itemsToRender.join(", ")]
  );

  const thirdTransform = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: thirdPosY.value,
        },
      ],
    }),
    [itemsToRender.join(", ")]
  );

  const itemStyles: any[] = [];

  if (itemsToRender[0]) {
    itemStyles.push([
      styles.item,
      {
        transform: [
          {
            translateY: windowHeight / 2,
          },
        ],
      },
      currentItemTransform,
    ]);
    if (itemsToRender[1]) {
      itemStyles.push([styles.item, nextItemTransform]);
    }
    if (itemsToRender[2]) {
      itemStyles.push([styles.item, thirdTransform]);
    }
  }
  return (
    <View style={styles.container}>
      <GestureDetector gesture={handler}>
        <Animated.View style={styles.itemContainer}>
          {(itemsToRender.length === 3
            ? [2, 1, 0]
            : itemsToRender.length === 1
            ? [0]
            : []
          ).map((i) => {
            const style = itemStyles[i];
            return (
              <Animated.View key={itemsToRender[i]} style={style}>
                <Text style={styles.text}>{itemsToRender[i]}</Text>
              </Animated.View>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 600,
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
  },
  itemContainer: {
    paddingHorizontal: 0,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  item: {
    position: "absolute",
    top: "20%",
    left: "10%",
    right: "10%",
    bottom: "60%",
    opacity: 0.6,
    backgroundColor: "green",
  },
  text: {
    fontSize: 80,
    textAlign: "center",
    color: "white",
  },
});

// simulate heavy operations on the JS thread
const OP_DURATION = 1000;
const OP_TIMEOUT = 5;

const heavyOp = () => {
  const start = new Date().getTime();
  while (new Date().getTime() < start + OP_DURATION) {
    // do nothing
  }
  setTimeout(heavyOp, OP_TIMEOUT);
};
setTimeout(heavyOp, 0);
