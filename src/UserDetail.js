// @flow

import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, Easing} from 'react-native';
import { withNavigation } from 'react-navigation';
import CircleTransition from 'react-native-expanding-circle-transition'

import {
  graphql,
  createFragmentContainer,
  QueryRenderer,
} from 'react-relay';
import environment from './createRelayEnvironment';

import { type UserDetail_query } from './__generated__/UserDetail_query.graphql';

type Props = {
  query: UserDetail_query,
};

const POSITON = 'custom'

@withNavigation
class UserDetail extends Component<void, Props, any> {

  static navigationOptions = {
    headerTitle: 'black',
    headerBackTitle: 'ddd',

  };

  state = { 
    visible: true,
    pressLocationX: 0,
    pressLocationY: 0,
  }

  componentDidMount() {
    this.setState({ visible: true })
  }

  back = (event) => {
    this.setState({ visible: false })
    const {goBack} = this.props.navigation;
    let pressLocationX = event.nativeEvent.locationX
    let pressLocationY = event.nativeEvent.locationY
    this.setState({
      customLeftMargin: pressLocationX,
      customTopMargin: pressLocationY
    },this.circleTransition.start(() => goBack(null)))
  }

  render() {
    const { user } = this.props.query;
    const {goBack} = this.props.navigation;
    const { visible, customLeftMargin, customTopMargin } = this.state;
    return (
      <View style={[styles.container, { backgroundColor: visible ? '#29C5DB' : 'white' } ]}>
       { visible &&
          <View>
            <View style={{ height: 80, alignItems: 'flex-start', justifyContent: 'center' }}>
           <Button
              onPress={(event) => this.back(event)}
              title="< Go back"
            />
            </View>
            <View style={styles.container}>
              <Text>ID: {user.id}</Text>
              <Text>Name: {user.name}</Text>
              <Text>Email: {user.email}</Text>
            </View> 
          </View>
       }
        <CircleTransition
          ref={(circle) => { this.circleTransition = circle }}
          color={'#29C5DB'}
          expand={false}
          duration={300}
          customTopMargin={customTopMargin}
          customLeftMargin={customLeftMargin}
          easing={Easing.linear}
          position={POSITON}
        />
      </View>
    );
  }
}

// UserDetailFragmentContainer
const UserDetailFragmentContainer = createFragmentContainer(
  UserDetail,
  graphql`
    fragment UserDetail_query on Query {
      user(id: $id) {
        id
        name
        email
      }
    }
  `,
);

// UserDetailQueryRenderer
const UserDetailQueryRenderer = ({ navigation }) => {
  return (
    <QueryRenderer
      environment={environment}
      query={graphql`
      query UserDetailQuery($id: ID!) {
        ...UserDetail_query
      }
    `}
      variables={{id: navigation.state.params.id}}
      render={({error, props}) => {
        if (props) {
          return <UserDetailFragmentContainer query={props} />;
        } else {
          return (
            <Text>Loading</Text>
          )
        }
      }}
    />
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#29C5DB',
  },
});

export default UserDetailQueryRenderer;
