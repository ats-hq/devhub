// @flow

import { mapValues, omit, union } from 'lodash';

import { guid } from '../../utils/helpers';

import {
  CREATE_COLUMN,
  DELETE_COLUMN,
  LOAD_SUBSCRIPTION_DATA_REQUEST,
  LOAD_SUBSCRIPTION_DATA_SUCCESS,
  LOAD_SUBSCRIPTION_DATA_FAILURE,
} from '../../utils/constants/actions';

import type {
  ApiRequestPayload,
  ApiResponsePayload,
  Action,
  Column,
  Normalized,
} from '../../utils/types';

type State = Normalized<Column>;
export default (state: State = {}, { type, payload }: Action<any>): State => {
  switch (type) {
    case CREATE_COLUMN:
      return (({ title, events, subscriptions, ...restOfPayload }: Column) => {
        const id = guid();

        return {
          [id]: {
            id,
            title,
            events: events || [],
            subscriptions: subscriptions || [],
            createdAt: new Date(),
            ...restOfPayload,
          },
          ...omit(state, id),
        };
      })(payload);

    case DELETE_COLUMN:
      return omit(state, payload.id);

    case LOAD_SUBSCRIPTION_DATA_REQUEST:
      return (({ subscriptionId }: ApiRequestPayload) => {
        let changed = false;
        const newColumns = mapValues(state, column => {
          if (column.subscriptions.indexOf(subscriptionId) < 0) return column;
          changed = true;

          return ({
            ...column,
            loading: true,
          });
        });

        return changed ? newColumns : state;
      })(payload);

    case LOAD_SUBSCRIPTION_DATA_SUCCESS:
      return (({ request: { subscriptionId }, data: { result } }: ApiResponsePayload) => {
        let changed = false;
        const newColumns = mapValues(state, column => {
          if (column.subscriptions.indexOf(subscriptionId) < 0) return column;
          changed = true;

          return ({
            ...column,
            events: union(result, column.events),
            loading: false,
            updatedAt: new Date(),
          });
        });

        return changed ? newColumns : state;
      })(payload);

    case LOAD_SUBSCRIPTION_DATA_FAILURE:
      return (({ request: { subscriptionId } }: ApiResponsePayload) => {
        let changed = false;
        const newColumns = mapValues(state, column => {
          if (column.subscriptions.indexOf(subscriptionId) < 0) return column;
          changed = true;

          return ({
            ...column,
            loading: false,
          });
        });

        return changed ? newColumns : state;
      })(payload);

    default:
      return state;
  }
};