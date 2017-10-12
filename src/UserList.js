// @flow

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  FlatList,
  Easing,
} from 'react-native';
import { withNavigation } from 'react-navigation';
import hoistStatics from 'hoist-non-react-statics';
import CircleTransition from 'react-native-expanding-circle-transition'

import environment from './createRelayEnvironment';

import {
  createPaginationContainer,
  graphql,
  QueryRenderer,
} from 'react-relay';

import { type UserList_query } from './__generated__/UserList_query.graphql';

type Props = {
  query: UserDetail_query,
};

type State = {
  isFetchingTop: boolean,
};

const ANIMATION_DURATION = 400
const INITIAL_VIEW_BACKGROUND_COLOR = '#E3E4E5'
const CIRCLE_COLOR1 = '#29C5DB'
const CIRCLE_COLOR2 = '#4EB8AE'
const CIRCLE_COLOR3 = '#81C781'
const CIRCLE_COLOR4 = '#B0D882'
const TRANSITION_BUFFER = 10
const POSITON = 'custom'

@withNavigation
class UserList extends Component<any, Props, State> {
  static navigationOptions = {
    title: 'UserList',
  };

  state = {
    isFetchingTop: false,
    viewBackgroundColor: INITIAL_VIEW_BACKGROUND_COLOR,
    circleColor: CIRCLE_COLOR1,
    customLeftMargin: 0,
    customTopMargin: 0,
    counter: 0
  };

  onRefresh = () => {
    const { users } = this.props.query;

    if (this.props.relay.isLoading()) {
      return;
    }

    this.setState({
      isFetchingTop: true,
    })

    this.props.relay.refetchConnection(users.edges.length, (err) => {
      this.setState({
        isFetchingTop: false,
      });
    });
  };

  onEndReached = () => {
    if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
      return;
    }

    // fetch more 2
    this.props.relay.loadMore(2, (err) => {
      console.log('loadMore: ', err);
    });
  };

  handlePress = (event, node) => {
    const { navigate } = this.props.navigation;    
    let pressLocationX = event.nativeEvent.locationX
    let pressLocationY = event.nativeEvent.locationY
    this.setState({
      customLeftMargin: pressLocationX,
      customTopMargin: pressLocationY
    }, this.circleTransition.start(() => this.goToUserDetail(node)))
  }

  renderItem = ({ item }) => {
    const { node } = item;

    return (
      <TouchableHighlight
        onPress={(event) => this.handlePress(event, node)}
        underlayColor="whitesmoke"
      >
        <View style={styles.userContainer}>
          <Text>{node.name}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  goToUserDetail = user => {
    const { navigate } = this.props.navigation;

    navigate('UserDetail', { id: user.id });
  };

  render() {
    const { users } = this.props.query;
    const {
      circleColor,
      viewBackgroundColor,
      customTopMargin,
      customLeftMargin
    } = this.state

    return (
      <View style={styles.container}>
        <FlatList
          data={users.edges}
          renderItem={this.renderItem}
          keyExtractor={item => item.node.id}
          onEndReached={this.onEndReached}
          onRefresh={this.onRefresh}
          refreshing={this.state.isFetchingTop}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={this.renderFooter}
        />
        <CircleTransition
          ref={(circle) => { this.circleTransition = circle }}
          color={circleColor}
          expand
          customTopMargin={customTopMargin}
          customLeftMargin={customLeftMargin}
          transitionBuffer={TRANSITION_BUFFER}
          duration={ANIMATION_DURATION}
          easing={Easing.linear}
          position={POSITON}
        />
      </View>
    );
  }
}

const UserListPaginationContainer = createPaginationContainer(
  UserList,
  {
    query: graphql`
      fragment UserList_query on Query {
        users(
          first: $count
          after: $cursor
        ) @connection(key: "UserList_users") {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              name
            }
          }
        }
      } 
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.query && props.query.users;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        count,
        cursor,
      };
    },
    variables: { cursor: null },
    query: graphql`
      query UserListPaginationQuery (
        $count: Int!,
        $cursor: String
      ) {
        ...UserList_query
      }
    `,
  },
);


const UserListQueryRenderer = () => {
  return (
    <QueryRenderer
      environment={environment}
      query={graphql`
      query UserListQuery(
        $count: Int!,
        $cursor: String
      ) {
        ...UserList_query
      }
    `}
      variables={{cursor: null, count: 1}}
      render={({error, props}) => {
        if (props) {
          return <UserListPaginationContainer query={props} />;
        } else {
          return (
            <Text>Loading</Text>
          )
        }
      }}
    />
  )
};

export default hoistStatics(UserListQueryRenderer, UserList);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#cccccc',
  },
  userContainer: {
    margin: 20,
  },
});
