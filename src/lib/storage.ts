import type {State} from './types';

export const DEFAULT_STATE:State={locale:'en',targetBand:'7.5',dailyGoal:20,cards:[],sessions:[],streak:0};

type StorageApi={storage:{local:{get:(key:string)=>Promise<Record<string,unknown>>;set:(value:Record<string,unknown>)=>Promise<void>}}};

function extensionApi():StorageApi|undefined{return (globalThis as typeof globalThis&{browser?:StorageApi}).browser}

export async function loadState():Promise<State>{const api=extensionApi();if(api){const value=await api.storage.local.get('state');return value.state?{...DEFAULT_STATE,...value.state as Partial<State>}:DEFAULT_STATE}const saved=globalThis.localStorage?.getItem('ielts-slayer-state');return saved?{...DEFAULT_STATE,...JSON.parse(saved) as Partial<State>}:DEFAULT_STATE}

export async function saveState(state:State):Promise<void>{const api=extensionApi();if(api){await api.storage.local.set({state});return}globalThis.localStorage?.setItem('ielts-slayer-state',JSON.stringify(state))}
