import React, { useEffect, useState } from 'react';
import { Typography, Box, Grid, TextField, Button } from '@mui/material';
import { API } from 'aws-amplify';
import { getActionItemsForAction } from '../../graphql/queries';

import useTranslation from '../customHooks/translations';
import { useContentTranslationsContext } from '../contexts/ContentTranslationsContext';

const ActionPanel = ({
  selectedAction,
  actionStyle,
  actionItemValues,
  setActionItemValues,
  setTotalCO2Saved,
  activeStep,
  setActiveStep,
}) => {
  const [actionItems, setActionItems] = useState();
  const [inputError, setInputError] = useState(false);
  const [disableButton, setDisableButton] = useState(true);

  const translation = useTranslation();
  const { contentTranslations } = useContentTranslationsContext();

  useEffect(() => {
    getActionItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //gets all action items related to the user selected action
  const getActionItems = async () => {
    if (translation.getLanguage() !== 'en') {
      const relevantTranslationObject = contentTranslations.find(
        (contentTranslation) =>
          contentTranslation.langCode.toLowerCase() ===
          translation.getLanguage().toLowerCase()
      );
      const relevantAction =
        relevantTranslationObject?.translationJSON?.actions?.find(
          (action) => action.action_id === selectedAction?.action_id
        );
      setActionItems(relevantAction?.action_items || []);
      return;
    }
    const res = await API.graphql({
      query: getActionItemsForAction,
      variables: { action_id: selectedAction?.action_id },
    });
    const items = res.data.getActionItemsForAction;
    setActionItems(items);
  };

  //updates total co2 saved value and records what user inputs for each item field on the form
  const handleActionItemInput = (value, item) => {
    //if user input is not an int/float and is not empty, do not update or set the actionItemValues
    if (value !== '' && !value.match(new RegExp('^([1-9]\\d*|0)(\\.\\d+)?$'))) {
      setInputError(true);
      return;
    }
    setInputError(false);
    //create the input object
    let input = {
      item_name: item.item_name,
      input_value: value,
      co2: value * item.co2_saved_per_unit,
    };

    if (value === '') {
      //if the user inputted value has been cleared, remove the actionItemValue from the array
      let updatedItemValues = actionItemValues.filter(
        (actionItem) => actionItem.item_name !== item.item_name
      );
      setActionItemValues(updatedItemValues);
    } else if (
      //if the action item has already been added, update the input value and the co2 value
      actionItemValues.some((element) => element.item_name === item.item_name)
    ) {
      let updatedItemValues = actionItemValues.map((itemValue) =>
        itemValue.item_name === item.item_name
          ? {
              ...itemValue,
              input_value: value,
              co2: value * item.co2_saved_per_unit,
            }
          : itemValue
      );
      setActionItemValues(updatedItemValues);
    } else {
      //if the action item has not been added, add the item and corresponding value into the array
      setActionItemValues((actionItemValues) => [...actionItemValues, input]);
    }
  };

  //set disable button to true if length of actionItemValues is 0 or if there's an input error
  useEffect(() => {
    setDisableButton(actionItemValues.length === 0 || inputError);
  }, [actionItemValues, inputError]);

  const renderActionForm = () => {
    if (actionItems) {
      return actionItems.map((item, index) => (
        <TextField
          key={index}
          id="outlined-basic"
          label={item.item_name}
          variant="outlined"
          helperText={item.item_description}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => handleActionItemInput(e.target.value, item)}
        />
      ));
    }
  };

  return (
    <Grid
      item
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2em',
          alignContent: 'center',
          width: '80%',
        }}
      >
        {inputError && (
          <Typography variant="subtitle2">
            {translation.mustBeNumber}
          </Typography>
        )}
        {renderActionForm()}
      </Box>
    </Grid>
  );
};

export default ActionPanel;
