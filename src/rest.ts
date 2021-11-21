import { Client } from "@/client";
import { APIResponse } from "@/types";
import fetch from "node-fetch";

export class RestManager {
    public apiURL: string;

    constructor(public client: Client) {
        this.apiURL = `http${this.client.insecure ? "": "s"}://${this.client.apiDomain}/v2`;
    }

    public async get<T>(path: string): Promise<APIResponse<T>> {
        return await (await fetch(`${this.apiURL}${path}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": this.client.token
            }
        })).json();
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public async post<T>(path: string, body?: any): Promise<APIResponse<T>> {
        return await (await fetch(`${this.apiURL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": this.client.token
            },
            body: body ? JSON.stringify(body) : undefined
        })).json();
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public async patch<T>(path: string, body?: any): Promise<APIResponse<T>> {
        return await (await fetch(`${this.apiURL}${path}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": this.client.token
            },
            body: body ? JSON.stringify(body) : undefined
        })).json();
    }

    public async delete<T>(path: string): Promise<APIResponse<T>> {
        const res = (await fetch(`${this.apiURL}${path}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": this.client.token
            }
        }));
        return await res.json();
    }
}