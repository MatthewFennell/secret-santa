import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import * as constants from './constants';
import AuthenticatedRoute from './auth/routes/AuthenticatedRoute';
import UnauthenticatedRoute from './auth/routes/UnauthenticatedRoute';

import SignIn from './auth/SignIn';

import * as routes from './routes';
import MyGroups from './myGroups/MyGroups';
import Profile from './profile/Profile';

const RenderRoutes:React.FC = () => (
    <Switch>
        <AuthenticatedRoute exact path={constants.URL.PROFILE} component={Profile} />
        {routes.signedInLinks.map(link => (
            <AuthenticatedRoute
                exact
                path={link.renderPath}
                key={link.renderPath}
                component={link.component}
            />
        ))}

        <AuthenticatedRoute
            path={constants.URL.MY_GROUPS}
            component={MyGroups}
        />

        <UnauthenticatedRoute
            path={constants.URL.SIGN_IN}
            component={SignIn}
            redirect={constants.URL.MY_GROUPS}
        />
        <UnauthenticatedRoute
            exact
            path="/"
            component={SignIn}
            redirect={constants.URL.MY_GROUPS}
        />
        <Route render={() => <Redirect to="/" />} />
    </Switch>
);

export default RenderRoutes;
