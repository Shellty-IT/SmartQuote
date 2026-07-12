export const DATA_MUTATION_EVENT = 'smartquote:data-mutated';

export interface DataMutationDetail {
    endpoint: string;
    method: string;
}

const SIDEBAR_ENTITY_ENDPOINT = /^\/(offers|clients|contracts|followups|leads)(?:\/|$)/;

export function affectsSidebarStats({ endpoint, method }: DataMutationDetail): boolean {
    return method.toUpperCase() !== 'GET' && SIDEBAR_ENTITY_ENDPOINT.test(endpoint);
}

export function emitDataMutation(detail: DataMutationDetail): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<DataMutationDetail>(DATA_MUTATION_EVENT, { detail }));
}
