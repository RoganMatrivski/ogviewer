import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import OgCard from "./OGCard";

import { OGMeta } from "@/types/OpenGraph";

const meta = {
	component: OgCard,
	render: (args) => <OgCard {...args} />,
} satisfies Meta<typeof OgCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		meta: {
			url: "https://fxtwitter.com/localthunk/status/1909697917222322438",
			description:
				"Anyone see Jimbo walking around with a BAFTA? My dude locked me in the bathroom and wrote his own speech",
			title: "localthunk (@LocalThunk)",
			image: "https://pbs.twimg.com/media/GoCcEJ2XQAA44zp.jpg",
		},
	},
};
