import { Address } from "viem"

export interface Voter {
    address: Address
    registeredOn: Date
}

export interface Proposal {
    description: string
    id: string
}

export enum WorkflowStatus {
    RegisteringVoters = 0,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied,
    Unknown
}