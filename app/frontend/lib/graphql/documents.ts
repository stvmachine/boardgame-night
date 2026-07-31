import { gql } from '@apollo/client'

// --- QUERIES ---

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      username
      email
      bggUsername
      displayName
      avatar
      isProvisional
      syncStatus {
        username
        status
        error
        gameCount
        lastSyncedAt
      }
    }
  }
`

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      collectionCount
      groupCount
      sessionCount
    }
  }
`

export const MY_GROUPS = gql`
  query MyGroups {
    myGroups {
      id
      name
      description
      inviteCode
      collectionTotalCount
      members {
        id
        displayName
        avatar
      }
      sessions {
        id
        title
        state
        scheduledAt
      }
    }
  }
`

export const GET_GROUP = gql`
    query GetGroup($token: String!) {
    group(token: $token) {
      id
      name
      description
      inviteCode
      anonymousBggUsernames
      myRole
      collectionTotalCount
      owner {
        id
        displayName
        avatar
      }
      members {
        id
        displayName
        bggUsername
        avatar
        isProvisional
      }
      memberships {
        id
        role
        user {
          id
        }
      }
      sessions {
        id
        title
        state
        scheduledAt
        location
        attendeeCount
      }
      pastSessions {
        id
        title
        state
        scheduledAt
        location
        pickedGame {
          name
          thumbnail
        }
      }
      collectionSpotlight {
        id
        objectid
        name
        thumbnail
        average
        owners {
          bggUsername
        }
      }
    }
  }
`

export const GET_NIGHT_SESSION = gql`
  query GetNightSession($id: ID!) {
    nightSession(id: $id) {
      id
      title
      description
      state
      scheduledAt
      location
      capacity
      timeBudgetMinutes
      complexityPreference
      attendeeCount
      host {
        id
        displayName
        avatar
      }
      group {
        id
        name
      }
      attendances {
        id
        response
        respondedAt
        user {
          id
          displayName
          avatar
          bggUsername
        }
      }
      pickedGame {
        id
        objectid
        name
        thumbnail
        average
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        averageWeight
        bestPlayerCount
      }
      suggestions {
        score
        confidence
        reasons
        breakdown {
          playerCountFit
          timeFit
          complexityFit
          communityRating
          ownershipBonus
        }
        thing {
          id
          objectid
          name
          thumbnail
          average
          minPlayers
          maxPlayers
          minPlaytime
          maxPlaytime
          averageWeight
          bestPlayerCount
        }
      }
      scores {
        id
        score
        rank
        user {
          id
          displayName
          avatar
        }
      }
    }
  }
`

export const MERGED_COLLECTION = gql`
  query MergedCollection($usernames: [String!]!) {
    mergedCollection(usernames: $usernames) {
      items {
        id
        objectid
        name
        yearPublished
        minPlayers
        maxPlayers
        minPlaytime
        maxPlaytime
        minAge
        image
        thumbnail
        description
        average
        bayesAverage
        usersRated
        averageWeight
        isExpansion
        bestPlayerCount
        lastPlayedAt
        owners {
          bggUsername
          avatar
        }
        polls {
          id
          name
          title
          totalVotes
          results {
            id
            value
            playerCount
            numVotes
          }
        }
      }
      syncStatuses {
        username
        status
        error
        gameCount
        lastSyncedAt
      }
    }
  }
`

export const HOT_ITEMS = gql`
  query HotItems {
    hotItems {
      id
      rank
      name
      yearPublished
      thumbnail
      average
      averageWeight
      minPlayers
      maxPlayers
      minPlaytime
      maxPlaytime
    }
  }
`

export const SEARCH_BGG = gql`
  query SearchBgg($query: String!) {
    search(query: $query) {
      id
      name
      yearPublished
    }
  }
`

export const GET_SESSION_INVITE = gql`
  query GetSessionInvite($token: String!) {
    sessionInvite(token: $token) {
      id
      email
      expiresAt
      status
      token
      role
      group {
        id
        name
      }
      session {
        id
        title
        state
        scheduledAt
        location
        host {
          id
          displayName
        }
      }
    }
  }
`

export const GET_USER = gql`
  query GetUser($username: String!) {
    user(username: $username) {
      id
      username
      bggUsername
      displayName
      avatar
      isProvisional
      syncStatus {
        username
        status
        error
        gameCount
        lastSyncedAt
      }
    }
  }
`

// --- MUTATIONS ---

export const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      user {
        id
        username
        email
        displayName
        bggUsername
        avatar
        isProvisional
      }
    }
  }
`

export const SIGN_UP = gql`
  mutation SignUp($email: String!, $password: String!, $username: String!) {
    signUp(email: $email, password: $password, username: $username) {
      token
      user {
        id
        username
        email
        displayName
        bggUsername
        avatar
        isProvisional
      }
    }
  }
`

export const SIGN_OUT = gql`
  mutation SignOut {
    signOut {
      success
    }
  }
`

export const BIND_BGG_USERNAME = gql`
  mutation BindBggUsername($username: String!) {
    bindBggUsername(username: $username) {
      user {
        id
        bggUsername
        syncStatus {
          status
          gameCount
        }
      }
    }
  }
`

export const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!, $description: String) {
    createGroup(name: $name, description: $description) {
      group {
        id
        name
        description
        inviteCode
      }
    }
  }
`

export const CREATE_ANONYMOUS_GROUP = gql`
  mutation CreateAnonymousGroup($name: String!, $bggUsernames: [String!]!) {
    createAnonymousGroup(name: $name, bggUsernames: $bggUsernames) {
      group {
        id
        name
        inviteCode
        anonymousBggUsernames
        collectionTotalCount
        myRole
        owner {
          id
          displayName
        }
        members {
          id
          displayName
          bggUsername
          avatar
        }
        collectionSpotlight {
          id
          objectid
          name
          thumbnail
          average
          owners {
            bggUsername
          }
        }
        sessions {
          id
          title
          state
          scheduledAt
        }
      }
    }
  }
`

export const CREATE_NIGHT_SESSION = gql`
  mutation CreateNightSession(
    $groupId: ID!
    $title: String!
    $description: String
    $capacity: Int
    $scheduledAt: ISO8601DateTime
    $location: String
    $timeBudgetMinutes: Int
    $complexityPreference: String
  ) {
    createNightSession(
      groupId: $groupId
      title: $title
      description: $description
      capacity: $capacity
      scheduledAt: $scheduledAt
      location: $location
      timeBudgetMinutes: $timeBudgetMinutes
      complexityPreference: $complexityPreference
    ) {
      session {
        id
        title
        state
      }
    }
  }
`

export const RSVP = gql`
  mutation Rsvp($token: String!, $response: String!, $nickname: String) {
    rsvp(token: $token, response: $response, nickname: $nickname) {
      attendance {
        id
        response
        user {
          id
          displayName
        }
      }
      session {
        id
        state
      }
    }
  }
`

export const START_PICKING = gql`
  mutation StartPicking($sessionId: ID!) {
    startPicking(sessionId: $sessionId) {
      session {
        id
        state
      }
    }
  }
`

export const PICK_GAME = gql`
  mutation PickGame($sessionId: ID!, $gameId: ID!) {
    pickGame(sessionId: $sessionId, gameId: $gameId) {
      session {
        id
        state
        pickedGame {
          id
          objectid
          name
          thumbnail
        }
      }
    }
  }
`

export const IMPORT_COLLECTION = gql`
  mutation ImportCollection($username: String!) {
    importCollection(username: $username) {
      user {
        id
        syncStatus {
          status
          gameCount
        }
      }
    }
  }
`

export const VALIDATE_BGG_USERNAME = gql`
  mutation ValidateBggUsername($username: String!) {
    validateBggUsername(username: $username) {
      validationResult {
        valid
        exists
        username
        avatar
      }
    }
  }
`

export const ACCEPT_GROUP_INVITE = gql`
  mutation AcceptGroupInvite($token: String!) {
    acceptGroupInvite(token: $token) {
      group {
        id
        name
      }
    }
  }
`

export const INVITE_TO_GROUP = gql`
  mutation InviteToGroup($email: String!, $groupId: ID!, $role: String) {
    inviteToGroup(email: $email, groupId: $groupId, role: $role) {
      inviteToken {
        id
        token
        email
        status
      }
    }
  }
`

export const SCHEDULE_SESSION = gql`
  mutation ScheduleSession(
    $sessionId: ID!
    $scheduledAt: ISO8601DateTime
    $location: String
    $capacity: Int
    $timeBudgetMinutes: Int
    $complexityPreference: String
  ) {
    scheduleSession(
      sessionId: $sessionId
      scheduledAt: $scheduledAt
      location: $location
      capacity: $capacity
      timeBudgetMinutes: $timeBudgetMinutes
      complexityPreference: $complexityPreference
    ) {
      session {
        id
        state
      }
      invitesSent
    }
  }
`

export const CANCEL_SESSION = gql`
  mutation CancelSession($sessionId: ID!) {
    cancelSession(sessionId: $sessionId) {
      session {
        id
        state
      }
    }
  }
`

export const REOPEN_SESSION = gql`
  mutation ReopenSession($sessionId: ID!) {
    reopenSession(sessionId: $sessionId) {
      session {
        id
        state
      }
    }
  }
`

export const UPDATE_SESSION_DETAILS = gql`
  mutation UpdateSessionDetails(
    $sessionId: ID!
    $title: String
    $description: String
    $location: String
    $scheduledAt: ISO8601DateTime
    $capacity: Int
  ) {
    updateSessionDetails(
      sessionId: $sessionId
      title: $title
      description: $description
      location: $location
      scheduledAt: $scheduledAt
      capacity: $capacity
    ) {
      session {
        id
        title
        description
        location
        scheduledAt
        capacity
        state
      }
    }
  }
`

export const UPDATE_SESSION_PREFERENCES = gql`
  mutation UpdateSessionPreferences(
    $sessionId: ID!
    $timeBudgetMinutes: Int
    $complexityPreference: String
  ) {
    updateSessionPreferences(
      sessionId: $sessionId
      timeBudgetMinutes: $timeBudgetMinutes
      complexityPreference: $complexityPreference
    ) {
      session {
        id
        timeBudgetMinutes
        complexityPreference
      }
    }
  }
`

export const REMOVE_GROUP_MEMBER = gql`
  mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
    removeGroupMember(groupId: $groupId, userId: $userId) {
      success
      removedMembershipId
    }
  }
`

export const UPDATE_GROUP_MEMBER_ROLE = gql`
  mutation UpdateGroupMemberRole($groupId: ID!, $userId: ID!, $role: String!) {
    updateGroupMemberRole(groupId: $groupId, userId: $userId, role: $role) {
      membership {
        id
        role
        user {
          id
          displayName
        }
      }
    }
  }
`

export const UPGRADE_TO_ACCOUNT = gql`
  mutation UpgradeToAccount($email: String!, $password: String!, $bggUsername: String) {
    upgradeToAccount(email: $email, password: $password, bggUsername: $bggUsername) {
      token
      user {
        id
        username
        email
        displayName
        isProvisional
      }
    }
  }
`

export const SUBMIT_SCORES = gql`
  mutation SubmitScores($sessionId: ID!, $scores: [ScoreInput!]!) {
    submitScores(sessionId: $sessionId, scores: $scores) {
      session {
        id
        scores {
          id
          score
          rank
          user {
            id
            displayName
            avatar
          }
        }
      }
    }
  }
`

// --- SUBSCRIPTIONS ---

export const COLLECTION_SYNCED = gql`
  subscription CollectionSynced($username: String!) {
    collectionSynced(username: $username) {
      username
      status
      error
      gameCount
      lastSyncedAt
    }
  }
`

// --- BGG PLAY HISTORY ---

export const MY_PLAYS = gql`
  query MyPlays($limit: Int) {
    myPlays(limit: $limit) {
      id
      date
      quantity
      bggGameObjectid
      gameName
      lengthMinutes
      incomplete
      nowInStats
      location
      comments
      winnersCount
      user {
        id
        displayName
        avatar
      }
      players {
        id
        bggUsername
        name
        score
        win
      }
    }
  }
`

export const GROUP_PLAYS = gql`
  query GroupPlays($groupId: ID!, $limit: Int) {
    groupPlays(groupId: $groupId, limit: $limit) {
      id
      date
      quantity
      bggGameObjectid
      gameName
      lengthMinutes
      incomplete
      nowInStats
      location
      comments
      winnersCount
      user {
        id
        displayName
        avatar
      }
      players {
        id
        bggUsername
        name
        score
        win
      }
    }
  }
`

export const GAME_PLAYS = gql`
  query GamePlays($groupId: ID!, $objectid: Int!, $limit: Int) {
    gamePlays(groupId: $groupId, objectid: $objectid, limit: $limit) {
      id
      date
      quantity
      bggGameObjectid
      gameName
      lengthMinutes
      incomplete
      nowInStats
      location
      comments
      winnersCount
      user {
        id
        displayName
        avatar
      }
      players {
        id
        bggUsername
        name
        score
        win
      }
    }
  }
`

export const IMPORT_PLAYS = gql`
  mutation ImportPlays($username: String!) {
    importPlays(username: $username) {
      success
      message
    }
  }
`
