export type Locale='en'|'vi';
export type Band='5.5'|'6.5'|'7.5'|'8.5';
export type Card={id:string;term:string;context:string;source:string;createdAt:number;dueAt:number;interval:number;ease:number;repetitions:number};
export type Session={date:string;minutes:number;words:number};
export type State={locale:Locale;targetBand:Band;dailyGoal:number;cards:Card[];sessions:Session[];streak:number};
export type Rating=0|1|2|3;
