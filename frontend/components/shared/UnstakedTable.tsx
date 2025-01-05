import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    fondation,
    formatWBTC,
    FondationEvent
} from "@/utils/contract"
import { useWatchContractEvent } from 'wagmi'
import { useState, useEffect } from "react"
import { Log, decodeEventLog, parseAbiItem } from 'viem'
import { usePublicClient } from 'wagmi'

const UnstakedTable = () => {

    const [events, setEvents] = useState<FondationEvent[]>([])
    const [refreshed, setRefreshed] = useState(false)

    const publicClient = usePublicClient()

    // Define the event ABI to decode
    const eventAbi = parseAbiItem(
        "event Unstaked(uint256 amount, uint256 when)"
    );

    const isEventAlreadyFetched = (when: Date) : boolean => {
        return events.some(event => event.when === when)
    }

    const addEventsFromLogs = (logs: Log[]) => {
        const eventsFromLogs = logs.map(log => {
            const decodedLog = decodeEventLog({
                abi: [eventAbi],
                data: log.data,
                topics: log.topics,
            });
            const date = new Date(Number(decodedLog.args.when)*1000);
            if (isEventAlreadyFetched(date)) {
                return null
            }
            return {
                amount: decodedLog.args.amount,
                when: date,
            };
        }).filter((event) => event !== null); // Filter out null values

        const unstakedEvents = events.concat(eventsFromLogs);

        setEvents(unstakedEvents);
    }

    /*useWatchContractEvent({
        address: fondation.address,
        abi: fondation.abi,
        eventName: 'Unstaked',
        onLogs(logs) {
            addEventsFromLogs(logs)
        },
    })*/

    useEffect(() => {
        
        if (!publicClient || refreshed) { return }

        const fetchEvents = async () => {
            try {
                // Query the logs for WorkflowStatusChange events
                const logs = await publicClient.getLogs({
                    address: fondation.address,
                    event: eventAbi,
                    fromBlock: 7427529n, // From the first block
                    toBlock: "latest", // Up to the latest block
                });

                setRefreshed(true)

                addEventsFromLogs(logs);
            } catch (error) {
                const title = "Error fetching events"
                console.error(`${title}:`, error)
            }
        }

        fetchEvents()

    }, [publicClient])

    return (
        <Table>
            <TableCaption >wBTC unstaked</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Amount (wBTC)</TableHead>
                    <TableHead className="text-right">Unstaked On</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events.map((event) => (
                    <TableRow key={event.when.toLocaleString()}>
                        <TableCell className="font-medium">{formatWBTC(event.amount)}</TableCell>
                        <TableCell className="text-right">{event.when.toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default UnstakedTable;