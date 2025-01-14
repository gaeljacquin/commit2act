import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography, Grid, Avatar } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import {
  getAllSubmittedActionsForUser,
  getSingleUser,
  getAllGroupsForUser,
} from '../graphql/queries';
import SubmittedActionCard from '../components/SubmittedActionCard';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState();
  const [userType, setUserType] = useState();
  const [validatedActions, setValidatedActions] = useState();
  const [groups, setGroups] = useState();
  const [showMore, setShowMore] = useState();
  const navigate = useNavigate();

  const getCurrentUserInfo = async () => {
    //if currently logged in user has the same id as the user profile link id, redirect user to their account settings page
    const cognitoUserEntry = await Auth.currentAuthenticatedUser();
    setUserType(cognitoUserEntry.attributes['custom:type']);
    const id = cognitoUserEntry.attributes['custom:id'];
    if (id === userId) {
      navigate(`/account-settings`);
    }

    const [userRes, userActionRes, userGroupRes] = await Promise.all([
      API.graphql({
        query: getSingleUser,
        variables: { user_id: userId },
      }),
      API.graphql({
        query: getAllSubmittedActionsForUser,
        variables: { user_id: userId },
      }),
      API.graphql({
        query: getAllGroupsForUser,
        variables: { user_id: userId },
      }),
    ]);
    setUser(userRes.data.getSingleUser);
    //filter for all validated actions
    const allActions = userActionRes.data.getAllSubmittedActionsForUser;
    const validated = allActions.filter((action) => action.is_validated);
    setValidatedActions(validated);

    //filter for all public groups
    const allGroups = userGroupRes.data.getAllGroupsForUser;
    const publicGroups = allGroups.filter((group) => group.is_public);
    setGroups(publicGroups);
  };

  const getActions = async () => {
    const res = await API.graphql({
      query: getAllSubmittedActionsForUser,
      variables: { user_id: userId },
    });
    //filter for all validated actions
    const allActions = res.data.getAllSubmittedActionsForUser;
    const validated = allActions.filter((action) => action.is_validated);
    setValidatedActions(validated);
  };

  useEffect(() => {
    getCurrentUserInfo();
  }, []);

  const renderValidatedActionCards = () => {
    //return if validatedActions is not null or undefined and contains at least 1 item
    if (Array.isArray(validatedActions) && validatedActions.length !== 0) {
      return (
        <Box
          sx={{
            height: '110vh',
            overflow: 'auto',
            padding: '0.25em',
          }}
        >
          <Stack spacing={2}>
            {showMore
              ? validatedActions.map((action, index) => (
                  <SubmittedActionCard
                    key={index}
                    action={action}
                    showUnapproveButton={userType === 'Admin'}
                    getActions={getActions}
                  />
                ))
              : validatedActions
                  .slice(0, 3)
                  .map((action, index) => (
                    <SubmittedActionCard
                      key={index}
                      action={action}
                      showUnapproveButton={userType === 'Admin'}
                      getActions={getActions}
                    />
                  ))}
            <Button
              sx={{ mt: '3em' }}
              variant="outlined"
              onClick={() => setShowMore(!showMore)}
            >
              View {showMore ? 'Less' : 'More'}
            </Button>
          </Stack>
        </Box>
      );
    } else {
      return (
        <Typography variant="subtitle2">
          There are no validated actions to show
        </Typography>
      );
    }
  };

  const renderUserGroups = () => {
    return (
      <>
        {/* show error message if user is not in any groups */}
        {groups && groups.length === 0 && (
          <Typography component="div" variant="subtitle2">
            {user.name} is not a member in any groups
          </Typography>
        )}
        {/* else display all of the user's public groups */}
        {groups && groups.length !== 0 && (
          <Grid
            item
            container
            columnSpacing={{ xs: 0, md: 1 }}
            sx={{
              width: '100%',
              padding: '1.5em',
              mt: '2em',
              alignItems: 'center',
              flexWrap: 'wrap',
              overflow: 'auto',
            }}
          >
            {groups.map((group, index) => (
              <Grid
                container
                item
                xs={6}
                sm={4}
                md={2}
                sx={{
                  justifyContent: 'center',
                  wordBreak: 'break-word',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                key={index}
              >
                <>
                  <Avatar
                    alt={group.group_name}
                    src={group.group_image ? group.group_image : null}
                    sx={{
                      width: 100,
                      height: 100,
                      ':hover': { opacity: '0.8', cursor: 'pointer' },
                    }}
                    onClick={() =>
                      navigate(`/group-profile/${group.group_name}`)
                    }
                  >
                    {group.group_name.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ mt: '0.5em' }}>
                    {group.group_name}
                  </Typography>
                </>
              </Grid>
            ))}
          </Grid>
        )}
      </>
    );
  };

  return (
    <>
      {user && (
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography
            variant="h1"
            sx={{ mt: { xs: '1.5em', md: '0' }, mb: '1.5em' }}
          >
            {user.name}'s Profile
          </Typography>
          <Grid
            container
            sx={{
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Grid
              item
              xs={12}
              md={3}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Avatar
                variant="rounded"
                src={user.avatar}
                sx={{
                  width: 100,
                  height: 100,
                }}
              ></Avatar>
            </Grid>
            <Grid
              item
              xs={12}
              md={9}
              sx={{
                width: '100%',
                borderRadius: '5px',
                padding: '1.5em',
                display: 'flex',
                justifyContent: { xs: 'center', md: 'space-between' },
                flexFlow: { xs: 'none', md: 'row wrap' },
                flexDirection: { xs: 'column' },
                alignItems: { xs: 'center', md: 'flex-start' },
                overflow: 'auto',
                mt: { xs: '1em', md: '0' },
              }}
            >
              <Box>
                <Typography variant="h7" component="div">
                  <Typography variant="h3" component="span" sx={{ mr: '1em' }}>
                    Name:
                  </Typography>
                  {user.name}
                </Typography>
                <Typography variant="h7" component="div">
                  <Typography variant="h3" component="span" sx={{ mr: '1em' }}>
                    Email:
                  </Typography>
                  {user.email}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Typography variant="h2" sx={{ m: '2.5em 0 1.25em' }}>
            {user.name}'s Groups
          </Typography>
          {renderUserGroups()}
          <Typography variant="h2" sx={{ m: '2.5em 0 1.25em' }}>
            {user.name}'s Actions
          </Typography>
          {renderValidatedActionCards()}
        </Box>
      )}
    </>
  );
};

export default UserProfile;
