import React from 'react'
import { StyleSheet, View } from 'react-native'

import { useCSSVariablesOrSpringAnimatedTheme } from '../../../../hooks/use-css-variables-or-spring--animated-theme'
import { useReduxAction } from '../../../../hooks/use-redux-action'
import { useReduxState } from '../../../../hooks/use-redux-state'
import { analytics } from '../../../../libs/analytics'
import { bugsnag } from '../../../../libs/bugsnag'
import { executeOAuth } from '../../../../libs/oauth'
import * as actions from '../../../../redux/actions'
import * as selectors from '../../../../redux/selectors'
import { tryParseOAuthParams } from '../../../../utils/helpers/auth'
import { getGitHubAppInstallUri } from '../../../../utils/helpers/shared'
import { SpringAnimatedText } from '../../../animated/spring/SpringAnimatedText'
import { Link } from '../../../common/Link'
import { cardStyles, getCardStylesForTheme } from '../../styles'
import { cardRowStyles } from './styles'

export interface PrivateNotificationRowProps {
  isRead?: boolean
  ownerId?: number | string | undefined
  repoId?: number | string | undefined
  smallLeftColumn?: boolean
}

export const PrivateNotificationRow = React.memo(
  (props: PrivateNotificationRowProps) => {
    const { ownerId, repoId, smallLeftColumn } = props

    const springAnimatedTheme = useCSSVariablesOrSpringAnimatedTheme()

    const existingAppToken = useReduxState(selectors.appTokenSelector)
    const githubAppToken = useReduxState(selectors.githubAppTokenSelector)
    const isLoggingIn = useReduxState(selectors.isLoggingInSelector)
    const installationsLoadState = useReduxState(
      selectors.installationsLoadStateSelector,
    )
    const loginRequest = useReduxAction(actions.loginRequest)

    const showLoadingIndicator =
      isLoggingIn || installationsLoadState === 'loading'

    async function startOAuth() {
      try {
        analytics.trackEvent('engagement', 'relogin_add_token_app')

        const params = await executeOAuth('app', {
          appToken: existingAppToken,
          scope: undefined,
        })

        const { appToken } = tryParseOAuthParams(params)
        if (!appToken) throw new Error('No app token')

        loginRequest({ appToken })
      } catch (error) {
        const description = 'OAuth execution failed'
        console.error(description, error)

        if (error.message === 'Canceled' || error.message === 'Timeout') return
        bugsnag.notify(error, { description })

        alert(`Authentication failed. ${error || ''}`)
      }
    }

    function renderContent() {
      if (!(existingAppToken && githubAppToken)) {
        return (
          <Link
            analyticsLabel="setup_github_app_from_private_notification"
            disabled={showLoadingIndicator}
            onPress={() => startOAuth()}
            style={cardRowStyles.mainContentContainer}
          >
            <SpringAnimatedText
              style={[
                getCardStylesForTheme(springAnimatedTheme).commentText,
                getCardStylesForTheme(springAnimatedTheme).mutedText,
                { fontStyle: 'italic' },
              ]}
            >
              Required permission is missing. Tap to login again.
            </SpringAnimatedText>
          </Link>
        )
      }

      return (
        <Link
          analyticsLabel="setup_github_app_from_private_notification"
          href={getGitHubAppInstallUri({
            repositoryIds: repoId ? [repoId] : [],
            suggestedTargetId: ownerId,
          })}
          openOnNewTab={false}
          style={cardRowStyles.mainContentContainer}
        >
          <SpringAnimatedText
            style={[
              getCardStylesForTheme(springAnimatedTheme).commentText,
              getCardStylesForTheme(springAnimatedTheme).mutedText,
              { fontStyle: 'italic' },
            ]}
          >
            Install the GitHub App on this repo to unlock details from private
            notifications.
          </SpringAnimatedText>
        </Link>
      )
    }

    return (
      <View style={cardRowStyles.container}>
        <View
          style={[
            cardStyles.leftColumn,
            smallLeftColumn
              ? cardStyles.leftColumn__small
              : cardStyles.leftColumn__big,
            cardStyles.leftColumnAlignTop,
          ]}
        />

        <View style={cardStyles.rightColumn}>
          <View
            style={{
              flex: 1,
              position: 'relative',
              opacity: showLoadingIndicator ? 0 : 1,
            }}
          >
            {renderContent()}
          </View>

          {!!showLoadingIndicator && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                },
              ]}
            >
              <SpringAnimatedText
                style={[
                  getCardStylesForTheme(springAnimatedTheme).commentText,
                  getCardStylesForTheme(springAnimatedTheme).mutedText,
                  { fontStyle: 'italic' },
                ]}
              >
                Checking required permissions...
              </SpringAnimatedText>
            </View>
          )}
        </View>
      </View>
    )
  },
)
