import { Client } from "@/client";

/* eslint-disable no-unused-vars */
export type CommandExecuteArguments = {
	line: string[];
	client: Client;
}

export interface Command {
    data: {
        name: string;
        aliases: string[];
		expectArg?: string;
		description?: string;
    };
    // eslint-disable-next-line no-unused-vars
    execute(arg: CommandExecuteArguments): void;
}

export enum GatewayEvent {
	WELCOME = 0,

	AUTHENTICATE = 1,
	AUTHENTICATE_SUCCESS = 2,
	AUTHENTICATE_ERROR = 3,

	CHANNEL_JOIN = 4,
	CHANNEL_JOIN_SUCCESS = 5,
	CHANNEL_JOIN_ERROR = 6,

	MESSAGE_SEND = 7,
	MESSAGE_SEND_SUCCESS = 8,
	MESSAGE_SEND_ERROR = 9,
	MESSAGE_NEW = 10,

	GROUP_GET_REQUEST = 11,
	GROUP_GET_SUCCESS = 12,

	ROOMS_GET_REQUEST = 13,
	ROOMS_GET_SUCCESS = 14,

	JOINED_NEW_GROUP = 15,

	SYSTEM_ANNOUNCEMENT = 16,

	APP_LOGIN_AUTHENTICATE = 17,
	APP_LOGIN_AUTHENTICATE_SUCCESS = 18,
	APP_LOGIN_AUTHENTICATE_ERROR = 19,
	APP_LOGIN_ACCEPT = 20,
	APP_LOGIN_REJECT = 21,

	GROUP_REMOVED = 22,
	CHANNEL_REMOVED = 23,

	CHANNEL_CREATE = 30,
	CHANNEL_DISCONNECT = 31,
	CHANNEL_UPDATE = 32,

	PING = 9001
}

export enum UserFlags {
	None = 0,
	Pro = 1 << 0,
	Dev = 1 << 1,
	Early = 1 << 2,
	ClosedBeta = 1 << 3,
	System = 1 << 4,
	AppDeveloper = 1 << 5
}

export enum Permissions {
	None = 0,

	ViewMessages = 1 << 0,
	SendMessages = 1 << 1,

	BanMembers = 1 << 2,
	KickMembers = 1 << 3,

	ManageGroup = 1 << 4,
	ManageRoles = 1 << 5,
	ManageChannels = 1 << 6,
	ManageMessages = 1 << 7,
	ManageInvites = 1 << 8,
	ManageMembers = 1 << 9,
	ManageSelfMember = 1 << 10,
	ManageWebhooks = 1 << 11,

	ViewChannelHistory = 1 << 12,
	ViewAuditLog = 1 << 13,
	CreateInvite = 1 << 14,
	AttachFiles = 1 << 15,

	All = ~(~0 << 16)
}

/* export ??? GatewayRequest {
	[GatewayEvent.AUTHENTICATE]: {
		token: string;
		allRooms?: boolean;
	};
	[GatewayEvent.CHANNEL_JOIN]: {
		id: string;
	};
	[GatewayEvent.MESSAGE_SEND]: {
		content: string;
		channelID?: string;
	};
	[GatewayEvent.GROUP_GET_REQUEST]: Record<string, never>;
	[GatewayEvent.ROOMS_GET_REQUEST]: {
		groupID: string;
	}
	[GatewayEvent.PING]: Record<string, never>;
} */

export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: APIError;
}

export enum APIError {
    UNKNOWN,
    MISSING_TOKEN,
    INCORRECT_TOKEN,
    INVALID_DATA,
    INVALID_CAPTCHA_RESPONSE,
    INVALID_EMAIL,
    EMAIL_USED,
    USERNAME_CLAIMED,
    NO_SUCH_USER,
    NO_SUCH_GROUP,
    INCORRECT_PASSWORD,
    NOT_VERIFIED,
    INVALID_VERIFICATION_TOKEN,
    NO_SUCH_INVITE,
    NOT_ENOUGH_PERMS,
    NO_INVITE_CODE,
    INVALID_USERNAME,
    ALREADY_IN_GROUP,
	NO_SUCH_APP,
	INVALID_SECRET,
	NO_SUCH_CHANNEL,
	NO_SUCH_MEMBER,
	USER_BANNED,
	USER_NOT_BANNED,
	NO_SUCH_ROLE,
	NO_SUCH_OVERRIDE,
}

export interface Channel {
    id: string;
    name: string;
    description: string;
    type: string;
    groupId: string;
    creaedAt: string;
    updatedAt: string;
}

export interface Group {
	id: string;
	name: string;
	avatarURL: string;
	defaultPermissions: Permissions;
	createdAt: string;
	updatedAt: string;
	channels?: Map<string, Channel>;
	roles?: Map<string, Role>;
}

export interface User {
	username: string;
	email: string;
	displayName: string | null;
	flags: UserFlags;
	proSince: string | null;
	proUntil: string | null;
	avatarURL: string;
}

export interface Member {
	username: string; // actual username
	name: string; // nickname
	displayName: string; // global displayName
	avatarURL: string;
}

export interface Message {
	id: string;
	author: Member;
	content: string;
	timestamp: string;
}

export interface Role {
	id: string;
	name: string;
	groupId: string;
	permissions?: number;
}