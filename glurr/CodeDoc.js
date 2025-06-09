import { el } from '../assets/system.js';
import { useFetch } from '../assets/useFetch.js';

export function CodeDoc({ file }) {
    const { data } = useFetch(file, 'text');
    const docs = React.useMemo(() => data?.split('\n')
        .filter(e => e.includes('///'))
        .map(e => e.match(/"([^"]+)" `([^`]+)` ?(.*)/) ?? e)
        .map(e => typeof e === 'string'
            ? e.split('#')[1] ?? e
            : ({ word: e?.[1], example: e?.[2], desc: e?.[3] }))
    );
    return el('div', {},
        docs?.map(e => 'string' == typeof e
            ? el('h2', { key: e }, e)
            : el('details', { key: e.word },
                el('summary', {}, e.word),
                el('p', {}, e.desc),
                el('code', {}, e.example),
            )
        )
    );
}
