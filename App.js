import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Intro from "./screens/Intro";
import Home from "./screens/Home";
import CreateNote from "./screens/CreateNote";
import ListNotes from "./screens/ListNotes";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={Intro} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="CreateNote" component={CreateNote} />
        <Stack.Screen name="ListNotes" component={ListNotes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
