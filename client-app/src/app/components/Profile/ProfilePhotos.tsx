import React, { SyntheticEvent, useState } from "react";
import { Button, Card, Grid, Header, Tab, Image } from "semantic-ui-react";
import { Photo, Profile } from "../../models/profile";
import { useStore } from "../../stores/store";
import PhotoUploadWidget from "../ImageUpload/PhotoUploadWidget";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import { observer } from "mobx-react-lite";

interface Props {
    profile: Profile;
}

const ProfilePhotos = ({ profile }: Props) => {
    const {
        profileStore: {
            isCurrentUser,
            uploadPhoto,
            uploading,
            loading,
            setMainPhoto,
            deletePhoto,
        },
    } = useStore();

    const [addPhotoMode, setAddPhotoMode] = useState(false);
    const [target, setTarget] = useState("");
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
    const [setMainConfirmationOpen, setSetMainConfirmationOpen] =
        useState(false);
    const [photoToSetMain, setPhotoToSetMain] = useState<Photo | null>(null);

    // Upload a photo
    function handlePhotoUpload(file: Blob) {
        uploadPhoto(file).then(() => setAddPhotoMode(false));
    }

    // Set main photo
    function handleSetMainConfirmationOpen(photo: Photo) {
        setPhotoToSetMain(photo);
        setSetMainConfirmationOpen(true);
    }

    function handleSetMainPhoto(
        photo: Photo,
        e: SyntheticEvent<HTMLButtonElement>
    ) {
        setTarget(e.currentTarget.name);
        handleSetMainConfirmationOpen(photo);
    }

    // Delete a photo
    function handleDeletePhotoClick(photo: Photo) {
        setPhotoToDelete(photo);
        setDeleteConfirmationOpen(true);
    }

    function handleDeleteConfirmationClose(confirmed: boolean) {
        if (confirmed && photoToDelete) {
            deletePhoto(photoToDelete);
        }
        setPhotoToDelete(null);
        setDeleteConfirmationOpen(false);
    }

    return (
        <Tab.Pane>
            <Grid>
                <Grid.Column width="16">
                    <Header floated="left" icon="user" content={`Photos`} />
                    {isCurrentUser && (
                        <div style={{ float: "right" }}>
                            {addPhotoMode ? (
                                <Button
                                    variant="contained"
                                    color="red"
                                    style={{
                                        marginRight: "10px",
                                        outline: "none",
                                        background: "red",
                                    }}
                                    onClick={() =>
                                        setAddPhotoMode(!addPhotoMode)
                                    }
                                >
                                    Cancel
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="green"
                                    style={{
                                        outline: "none",
                                        background: "green",
                                    }}
                                    onClick={() =>
                                        setAddPhotoMode(!addPhotoMode)
                                    }
                                >
                                    Add Photo
                                </Button>
                            )}
                        </div>
                    )}
                </Grid.Column>
                <Grid.Column width="16">
                    {addPhotoMode ? (
                        <PhotoUploadWidget
                            uploadPhoto={handlePhotoUpload}
                            loading={uploading}
                        />
                    ) : (
                        <Card.Group itemsPerRow={5}>
                            {profile.photos?.map((photo) => (
                                <Card key={photo.id}>
                                    <Image src={photo.url} />
                                    {isCurrentUser && (
                                        <Button.Group fluid widths={9}>
                                            <Button
                                                variant="contained"
                                                color="green"
                                                content="Main"
                                                name={"main" + photo.id}
                                                loading={
                                                    target ===
                                                        "main" + photo.id &&
                                                    loading
                                                }
                                                disabled={
                                                    photo.isMain || loading
                                                }
                                                onClick={(e) =>
                                                    handleSetMainPhoto(photo, e)
                                                }
                                            />
                                            <Button
                                                variant="contained"
                                                color="red"
                                                icon="trash"
                                                loading={
                                                    target === photo.id &&
                                                    loading
                                                }
                                                disabled={
                                                    photo.isMain || loading
                                                }
                                                onClick={(e) =>
                                                    handleDeletePhotoClick(
                                                        photo
                                                    )
                                                }
                                                name={photo.id}
                                            />
                                        </Button.Group>
                                    )}
                                </Card>
                            ))}
                        </Card.Group>
                    )}
                </Grid.Column>
            </Grid>
            <Dialog
                open={deleteConfirmationOpen}
                onClose={() => handleDeleteConfirmationClose(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this photo?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => handleDeleteConfirmationClose(true)}
                        color="red"
                    >
                        Delete
                    </Button>
                    <Button
                        onClick={() => handleDeleteConfirmationClose(false)}
                        color="green"
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={setMainConfirmationOpen}
                onClose={() => setSetMainConfirmationOpen(false)}
            >
                <DialogTitle>Confirm Main Photo</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to set this photo as your main
                        photo?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setMainPhoto(photoToSetMain!);
                            setSetMainConfirmationOpen(false);
                        }}
                        color="green"
                    >
                        Set as Main
                    </Button>
                    <Button
                        onClick={() => setSetMainConfirmationOpen(false)}
                        color="red"
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Tab.Pane>
    );
};

export default observer(ProfilePhotos);
