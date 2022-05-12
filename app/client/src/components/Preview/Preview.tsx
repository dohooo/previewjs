import { faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";
import {
  faCode,
  faExternalLink,
  faTerminal,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UNKNOWN_TYPE } from "@previewjs/type-analyzer";
import { useWindowSize } from "@react-hook/window-size";
import { observer } from "mobx-react-lite";
import React from "react";
import { decodeComponentId } from "../../component-id";
import { FilePath } from "../../design/FilePath";
import { Header } from "../../design/Header";
import { Link } from "../../design/Link";
import { SmallLogo } from "../../design/SmallLogo";
import { PanelTab, TabbedPanel } from "../../design/TabbedPanel";
import { ValueEditor } from "../../design/ValueEditor";
import { VariantPicker } from "../../design/VariantPicker";
import { PreviewState } from "../../PreviewState";
import { ActionLogs } from "../ActionLogs";
import { ConsolePanel } from "../ConsolePanel";
import { Error } from "../Error";
import { UpdateBanner } from "../UpdateBanner";

export const Preview = observer(
  ({
    state,
    appLabel,
    headerAddon,
    subheader,
    footer,
    panelTabs,
    viewport,
  }: {
    state: PreviewState;
    appLabel: string;
    headerAddon?: React.ReactNode;
    subheader?: React.ReactNode;
    footer?: React.ReactNode;
    panelTabs?: PanelTab[];
    viewport: React.ReactNode;
  }) => {
    const [width, height] = useWindowSize();
    const panelHeight = height * 0.3;

    if (!state.reachable) {
      return (
        <div className="h-screen bg-gray-700 text-gray-100 p-2 grid place-items-center text-lg">
          <div
            id="app-error"
            className="p-4 rounded-lg text-red-800 bg-red-50 filter drop-shadow-lg"
          >
            Server disconnected. Is Preview.js still running?
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen overflow-hidden bg-white">
        <ActionLogs state={state.actionLogs} />
        <Header>
          <Header.Row>
            {headerAddon}
            {state.component?.componentId && (
              <>
                <FilePath
                  key="file"
                  filePath={
                    decodeComponentId(state.component.componentId)
                      .currentFilePath
                  }
                />
                <Link
                  href={document.location.href}
                  target="_blank"
                  title="Open in new tab"
                  className="text-gray-500 hover:text-gray-200 ml-2 text-lg"
                >
                  <FontAwesomeIcon icon={faExternalLink} fixedWidth />
                </Link>
              </>
            )}
            <div className="flex-grow"></div>
            <SmallLogo
              href="https://previewjs.com/docs"
              label={appLabel}
              title={state.appInfo?.version && `v${state.appInfo.version}`}
            />
            <Link
              className="ml-2 text-xl text-[#1DA1F2] hover:text-white"
              href="https://twitter.com/previewjs"
              target="_blank"
              title="Follow Preview.js on Twitter"
            >
              <FontAwesomeIcon icon={faTwitter} fixedWidth />
            </Link>
            <Link
              className="ml-2 text-xl bg-[#333] text-white rounded-md hover:bg-white hover:text-[#333]"
              href="https://github.com/fwouts/previewjs"
              target="_blank"
              title="Star Preview.js on GitHub"
            >
              <FontAwesomeIcon icon={faGithub} fixedWidth />
            </Link>
          </Header.Row>
          {subheader && (
            <Header.Row className="bg-gray-100">{subheader}</Header.Row>
          )}
        </Header>
        <UpdateBanner state={state.updateBanner} />
        {state.component ? (
          viewport
        ) : (
          <div
            id="no-selection"
            className="flex-grow bg-gray-700 text-gray-100 p-2 grid place-items-center text-lg"
          >
            Please select a component to preview.
          </div>
        )}
        <Error state={state.error} />
        <TabbedPanel
          defaultTabKey="props"
          tabs={[
            ...(state.component
              ? [
                  {
                    label: "Properties",
                    key: "props",
                    icon: faCode,
                    notificationCount: 0,
                    panel: (
                      <VariantPicker
                        variants={state.component.details?.variants || []}
                        currentVariant={state.component.variantKey}
                        onVariantSelected={(key) => state.setVariant(key)}
                      >
                        {state.component.variantKey === "custom" ? (
                          <ValueEditor
                            type={
                              state.component.details?.propsType || UNKNOWN_TYPE
                            }
                            types={state.component.details?.types || {}}
                          />
                        ) : (
                          <pre>
                            {JSON.stringify(
                              state.component.details?.variants?.find(
                                (v) => v.key === state.component?.variantKey
                              )?.props
                            )}
                          </pre>
                        )}
                      </VariantPicker>
                    ),
                  },
                ]
              : []),
            ...(state.component
              ? [
                  {
                    label: "Console",
                    key: "console",
                    icon: faTerminal,
                    notificationCount: state.consoleLogs.unreadCount,
                    panel: <ConsolePanel state={state.consoleLogs} />,
                  },
                ]
              : []),
            ...(panelTabs || []),
          ]}
          height={panelHeight}
        />
        {footer}
      </div>
    );
  }
);
