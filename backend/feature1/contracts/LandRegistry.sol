// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LandRegistry {
    
    struct LandRecord {
        string landId;
        string ownerName;
        uint256 mappedArea;
        uint256 documentArea;
        uint256 confidenceScore;
        string status;
        uint256 timestamp;
        string ipfsHash; // For storing the heavy document/polygon data off-chain
    }

    mapping(string => LandRecord) public records;
    string[] public landIds;

    event LandVerified(string indexed landId, string status, uint256 confidenceScore, uint256 timestamp);

    function registerLand(
        string memory _landId,
        string memory _ownerName,
        uint256 _mappedArea,
        uint256 _documentArea,
        uint256 _confidenceScore,
        string memory _status,
        string memory _ipfsHash
    ) public {
        records[_landId] = LandRecord({
            landId: _landId,
            ownerName: _ownerName,
            mappedArea: _mappedArea,
            documentArea: _documentArea,
            confidenceScore: _confidenceScore,
            status: _status,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash
        });
        
        landIds.push(_landId);
        emit LandVerified(_landId, _status, _confidenceScore, block.timestamp);
    }

    function getLandRecord(string memory _landId) public view returns (LandRecord memory) {
        return records[_landId];
    }
}
