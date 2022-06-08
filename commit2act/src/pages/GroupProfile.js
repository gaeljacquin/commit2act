import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Tab,
  Grid,
  Avatar,
  Stack,
  Paper,
} from '@mui/material';
import { TabPanel, TabContext, TabList } from '@mui/lab';
import {
  AutoGraphOutlined,
  PeopleAlt,
  Public,
  Lock,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { Auth, API } from 'aws-amplify';
import {
  getSingleGroupByName,
  getSingleGroup,
  getAllUsersInGroup,
  getAllOwnersInGroup,
} from '../graphql/queries';
import GroupMemberPanel from '../components/groupProfile/GroupMemberPanel';
import AddMemberPanel from '../components/groupProfile/AddMemberPanel';
import MemberActionsPanel from '../components/groupProfile/MemberActionsPanel';
import GroupInfoPanel from '../components/groupProfile/GroupInfoPanel';
import { styled } from '@mui/material/styles';
import GroupPageLeaderboard from '../components/groupProfile/GroupPageLeaderboard';
import EditGroupPanel from '../components/groupProfile/EditGroupPanel';

const StyledPaper = styled(Paper)`
  padding: 1em 2em;
  text-align: center;
  .statValue {
    margin-top: 0.5em;
  }
`;

const GroupProfile = () => {
  const { groupName } = useParams();
  const tabs = [
    'Group Info',
    'Member Actions',
    'Group Members',
    'Add Members',
    'Edit Group Info',
  ];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [groupInfo, setGroupInfo] = useState();
  const [groupMembers, setGroupMembers] = useState();
  const [groupOwners, setGroupOwners] = useState();
  const [currentUserOwner, setCurrentUserOwner] = useState(false);
  const [cognitoUser, setCognitoUser] = useState();
  const [userId, setUserId] = useState();
  const [groupId, setGroupId] = useState();

  useEffect(() => {
    const getGroupAndUserInfo = async () => {
      const [cognitoRes, groupInfoRes] = await Promise.all([
        Auth.currentAuthenticatedUser(),
        API.graphql({
          query: getSingleGroupByName,
          variables: { group_name: groupName },
        }),
      ]);
      setCognitoUser(cognitoRes);
      setGroupInfo(groupInfoRes.data.getSingleGroupByName);
      const currentUserId = Number(cognitoRes.attributes['custom:id']);
      setUserId(currentUserId);
      const currentGroupId = groupInfoRes.data.getSingleGroupByName.group_id;
      setGroupId(currentGroupId);
    };
    getGroupAndUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    //gets array of all group owners and checks if the current user is a owner
    const isUserGroupOwner = async () => {
      const ownerRes = await API.graphql({
        query: getAllOwnersInGroup,
        variables: { group_id: groupId },
      });
      const owners = ownerRes.data.getAllOwnersInGroup;
      setGroupOwners(owners);
      const ownerIds = owners.map((owner) => owner.user_id);
      if (ownerIds.includes(userId)) {
        setCurrentUserOwner(true);
      }
    };

    //gets list of all users
    const getGroupUsers = async () => {
      const memberRes = await API.graphql({
        query: getAllUsersInGroup,
        variables: { group_id: groupId },
      });
      setGroupMembers(memberRes.data.getAllUsersInGroup);
    };
    if (userId && groupId) {
      isUserGroupOwner();
      getGroupUsers();
    }
  }, [userId, groupId, groupInfo]);

  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
  };

  const getUpdatedGroup = async (id) => {
    const updatedGroupRes = await API.graphql({
      query: getSingleGroup,
      variables: { group_id: id },
    });
    setGroupInfo(updatedGroupRes.data.getSingleGroup);
  };

  return (
    <>
      {groupInfo && (
        <Grid
          container
          alignItems={{ xs: 'center' }}
          direction={{ xs: 'column', lg: 'row' }}
          sx={{ mt: '2em' }}
          gap={{ xs: '2em', lg: '0' }}
          textAlign={{ xs: 'center', md: 'left' }}
        >
          <Grid
            container
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent={{ xs: 'center' }}
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            spacing={{ xs: 4, sm: 8 }}
            sx={{ mb: '1.5em', overflow: 'auto' }}
          >
            <Grid item xs={2}>
              <Avatar
                variant="rounded"
                sx={{
                  width: 150,
                  height: 150,
                }}
                src={groupInfo.group_image ? groupInfo.group_image : null}
              >
                {groupInfo.group_name.charAt(0)}
              </Avatar>
            </Grid>
            <Grid
              item
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5em',
                overflow: 'auto',
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  mb: '0.5em',
                  wordWrap: 'break-word',
                  maxWidth: { xs: '300px', sm: '100%' },
                }}
              >
                {groupName}
              </Typography>
              <Stack direction="row" alignItems="center" gap={1}>
                <PeopleAlt />
                <Typography component="div" variant="subtitle2">
                  Members: {groupMembers && groupMembers.length}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                {groupInfo.is_public ? <Public /> : <Lock />}
                <Typography component="div" variant="subtitle2">
                  {groupInfo.is_public ? 'Public' : 'Private'}
                </Typography>
              </Stack>
            </Grid>
            <Grid
              item
              xs={12}
              sm={7.5}
              justifyContent="center"
              sx={{ width: '70%' }}
            >
              <Box
                component={Paper}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-evenly',
                  backgroundColor: '#DBE2EF',
                  borderRadius: '8px',
                  padding: '1.5em',
                  gap: { xs: '0.5em', md: '2' },
                }}
              >
                <StyledPaper elevation={6}>
                  <Typography variant="h4">CO2 Saved This Week</Typography>
                  <Typography variant="h5" className="statValue">
                    <AutoGraphOutlined fontSize="large" />
                    {groupInfo.weekly_co2}g
                  </Typography>
                </StyledPaper>
                <StyledPaper elevation={6}>
                  <Typography variant="h4">Total CO2 Saved</Typography>
                  <Typography variant="h5" className="statValue">
                    {groupInfo.total_co2}g
                  </Typography>
                </StyledPaper>
              </Box>
            </Grid>
          </Grid>

          <Grid
            container
            item
            sx={{
              mt: { xs: '2em', md: '3em' },
              width: { xs: '70%', sm: '100%' },
            }}
          >
            <GroupPageLeaderboard
              currentGroup={groupInfo}
              groupMembers={groupMembers}
              userId={userId}
            />
          </Grid>
          <Grid
            container
            item
            sx={{
              mt: { xs: '2em', md: '3em' },
              width: { xs: '70%', sm: '100%' },
            }}
          >
            <TabContext value={selectedTab}>
              <Box
                sx={{
                  borderBottom: 1,
                  borderTop: 1,
                  borderColor: 'divider',
                  maxWidth: { xs: 320, sm: '100%' },
                  width: { sm: '100%' },
                  display: 'flex',
                  padding: '0.5em',
                }}
              >
                <TabList
                  onChange={handleTabChange}
                  aria-label="group profile tabs"
                  scrollButtons
                  allowScrollButtonsMobile
                  variant="scrollable"
                >
                  <Tab label={tabs[0]} value={tabs[0]} />
                  <Tab label={tabs[1]} value={tabs[1]} />
                  <Tab label={tabs[2]} value={tabs[2]} />
                  {/* only display following tabs if current user is a group owner */}
                  {currentUserOwner && <Tab label={tabs[3]} value={tabs[3]} />}
                  {currentUserOwner && <Tab label={tabs[4]} value={tabs[4]} />}
                </TabList>
              </Box>
              <TabPanel
                value={tabs[0]}
                sx={{
                  width: '100%',
                }}
              >
                <GroupInfoPanel
                  groupOwners={groupOwners}
                  groupInfo={groupInfo}
                />
              </TabPanel>
              <TabPanel
                value={tabs[1]}
                sx={{
                  padding: { xs: '0' },
                  width: '100%',
                }}
              >
                <MemberActionsPanel groupInfo={groupInfo} />
              </TabPanel>
              <TabPanel
                value={tabs[2]}
                sx={{
                  padding: { xs: '0' },
                  width: '100%',
                }}
              >
                <GroupMemberPanel
                  groupMembers={groupMembers}
                  setGroupMembers={setGroupMembers}
                  groupInfo={groupInfo}
                  currentUserOwner={currentUserOwner}
                  cognitoUser={cognitoUser}
                />
              </TabPanel>
              <TabPanel
                value={tabs[3]}
                sx={{
                  padding: { xs: '1.5em 0' },
                  width: '100%',
                }}
              >
                <AddMemberPanel groupInfo={groupInfo} />
              </TabPanel>
              <TabPanel
                value={tabs[4]}
                sx={{
                  padding: { xs: '1.5em 0' },
                  width: '100%',
                }}
              >
                <EditGroupPanel
                  groupInfo={groupInfo}
                  // getGroupInfo={getGroupInfo}
                  getUpdatedGroup={getUpdatedGroup}
                />
              </TabPanel>
            </TabContext>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default GroupProfile;
