import type { SVGProps } from 'react';
const paths: Record<string,string> = {
 home:'m3 10 9-7 9 7v10H3z M9 20v-7h6v7', jobs:'M7 3h10v18H7z M10 7h4 M10 11h4 M10 15h2', map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
 drivers:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-3.8',
 account:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
 shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z', pricing:'M3 3h8l10 10-8 8L3 11z M7 7h.01', payments:'M3 5h18v14H3z M3 9h18 M7 14h3', reports:'M5 20V10 M12 20V4 M19 20v-8', settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
 help:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4 M12 17h.01', truck:'M3 5h11v13H3z M14 10h4l3 4v4h-7 M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M17 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
 search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6', pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6', check:'m5 12 4 4 10-10', arrow:'M4 12h16 M14 6l6 6-6 6', chevron:'m9 5 7 7-7 7', collapse:'m10 5-7 7 7 7 M21 5l-7 7 7 7', menu:'M4 6h16 M4 12h16 M4 18h16', package:'m12 3 9 5v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9 M7.5 5.5l9 5', clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2', star:'m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z', moon:'M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10', sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1',
};
export function Icon({name='package',size=20,...props}:SVGProps<SVGSVGElement> & {name?:string;size?:number}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[name] ?? paths.package}/></svg>;
}
