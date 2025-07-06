import getOG from "@/actions/FetchOG";
import OGCard from "@/components/OGCard";

export default async function Home() {
	const data = await getOG(
		"https://fxtwitter.com/localthunk/status/1909697917222322438",
	);
	return (
		<div className="container">
			<OGCard meta={data} />
		</div>
	);
}
