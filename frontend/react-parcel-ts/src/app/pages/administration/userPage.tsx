import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '~app/components/button';
import { ButtonGroup } from '~app/components/buttonGroup';
import { Section } from "../../components/section";
import {
  User,
  Loadable,
  newLoadable,
  updateLoadable,
  LoadStatus,
  UserType
} from "../../types";

interface IProps {
  match: { params: { id: "new" | number } };
}

interface IState {
  id: "new" | number;
  user: Loadable<User>;
  saveStatus: "none" | "saving" | "saved";
}

export class UserPage extends React.Component<IProps, IState>{
  constructor(props: IProps) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      user: newLoadable(),
      saveStatus: "none"
    };
  }

  async componentDidMount() {
    const { id } = this.state;
    if (id === "new") {
      this.initializeNewUser();
    }
    else {
      await this.loadUser(id);
    }
  }

  async componentDidUpdate(_: IProps, prevState: IState) {
    if (prevState.id !== this.state.id && this.state.id != "new") {
      await this.loadUser(this.state.id);
    }
  }

  initializeNewUser() {
    this.setState({
      id: "new",
      user: updateLoadable({
        id: 0,
        username: '',
        name: 'new user',
        userType: UserType.InteractiveUser,
        createdOn: new Date()
      }, LoadStatus.Loaded)
    });
  }

  async loadUser(id: number) {
    this.setState({ user: updateLoadable(null, LoadStatus.Loading) });
    const response = await fetch(`/api/fe/users/${id}`);
    if (response.ok) {
      const json = await response.json();
      const user = {
        id: json.id,
        username: json.username,
        name: json.name,
        userType: json.userType,
        createdOn: new Date(json.createdOn)
      };
      this.setState({ user: updateLoadable(user, LoadStatus.Loaded) });
    }
    else {
      this.setState({ user: updateLoadable(null, LoadStatus.Error) });
    }
  }

  async saveUser() {
    const { user } = this.state;
    if (!user.data) return;

    this.setState({ saveStatus: "saving" });
    if (this.state.id == "new") {
      const response = await fetch(`/api/fe/users`, {
        method: "POST",
        body: JSON.stringify({
          name: user.data.name,
          username: user.data.username
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      if (response.ok) {
        const json = await response.json();
        this.setState({
          saveStatus: "saved",
          id: json.id
        });
      }
      else {
        // todo: error handling
      }
    }
    else {
      const response = await fetch(`/api/fe/users/${this.state.id}`, {
        method: "POST",
        body: JSON.stringify({
          name: user.data.name,
          username: user.data.username
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      if (response.ok) {
        this.setState({ saveStatus: "saved" });
      }
      else {
        // todo: error handling
      }

    }
  }

  public render() {
    const { status } = this.state.user;
    if (status == LoadStatus.New || status == LoadStatus.Loading) {
      return <Section>Loading...</Section>;
    }
    else if (status == LoadStatus.Error) {
      return <Section>An error occurred.</Section>;
    }
    else {
      const user = this.state.user.data!;

      return (
        <Section>
          <h1>User: {user.name}</h1>
          <label>
            <span>Name:</span>
            <input type="text" value={user.name} onChange={(v) => this.updateUser({ name: v.target.value })} />
          </label>
          <label>
            <span>Username:</span>
            <input type="text" value={user.username} onChange={(v) => this.updateUser({ username: v.target.value })} />
          </label>
          <ButtonGroup>
            <Link to="/administration" className="gdb-button gdb-bs-secondary">Cancel</Link>
            <Button
              enable={user.name.length > 0}
              onClick={() => this.saveUser()}
            >Save</Button>
          </ButtonGroup>
        </Section>
      );
    }
  }

  public updateUser(change: any) {
    const user = {
      ...this.state.user.data,
      ...change
    };
    this.setState({ user: updateLoadable(user, LoadStatus.Loaded) });
  }
}
