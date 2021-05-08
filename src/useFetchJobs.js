import {useReducer, useEffect } from 'react';
import axios from 'axios';

const _actions = {
    _make_request: 'make-request',
    _get_data: 'get-data',
    _error: 'error',
    _update_has_next_page: 'update-has-next-page'
};

const _base_url = 'https://secret-ocean-49799.herokuapp.com/https://jobs.github.com/positions.json';

function reducer(state, action) {
    switch(action.type) {
        case _actions._make_request:
            return {loading: true, jobs: []}
        case _actions._get_data:
            return {...state, loading: false, jobs: action.payload.jobs};
        case _actions._error:
            return {...state, loading: false, error: action.payload.error, jobs: []};
        case _actions._update_has_next_page:
            return {...state, hasNextPage: action.payload.hasNextPage}
        default:
            return state;
    }
}

export default function useFetchJobs (params, page) {
    const [state, dispatch] = useReducer(reducer, {jobs: [], loading: true, error: false});


    useEffect(() => {
        const cancelToken1 = axios.CancelToken.source()
        dispatch( {type: _actions._make_request});
        axios.get(_base_url, 
            {
                cancelToken: cancelToken1.token,
                params: {markdown: true, page: page, ...params}
            }
            ).then(res => {
                dispatch({type: _actions._get_data, payload: {jobs: res.data}}); 
            }).catch(e => {
                if(axios.isCancel(e))
                {
                    return
                }
                dispatch({type: _actions._error, payload: {error: e}}); 
            });

            const cancelToken2 = axios.CancelToken.source()
            axios.get(_base_url, 
                {
                    cancelToken: cancelToken2.token,
                    params: {markdown: true, page: page + 1, ...params}
                }
                ).then(res => {
                    dispatch({type: _actions._update_has_next_page, payload: { hasNextPage: res.data.length !== 0}}); 
                }).catch(e => {
                    if(axios.isCancel(e))
                    {
                        return
                    }
                    dispatch({type: _actions._error, payload: {error: e}}); 
                });

        return () => {
            cancelToken1.cancel();
            cancelToken2.cancel();
        }
    }, [params, page]);

    return state;
}