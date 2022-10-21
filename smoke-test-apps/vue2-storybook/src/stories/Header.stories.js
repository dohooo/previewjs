import MyHeader from "./Header";

export default {
  title: "Example/Header",
  component: MyHeader,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/vue/configure/story-layout
    layout: "fullscreen",
  },
  decorators: [
    () => ({ template: '<div style="background: red;"><story/></div>' }),
  ],
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { MyHeader },
  template:
    '<my-header :user="user" @onLogin="onLogin" @onLogout="onLogout" @onCreateAccount="onCreateAccount" />',
});

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  user: {
    name: "Jane Doe",
  },
};
LoggedIn.decorators = [
  () => ({ template: '<div style="margin: 3em;"><story/></div>' }),
];

export const LoggedOut = Template.bind({});
LoggedOut.args = {};
